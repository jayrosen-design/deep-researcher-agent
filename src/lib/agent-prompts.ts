export const AGENT_SYSTEM_PROMPT = `You are an autonomous deep-research investigator. Your sole job is to gather evidence by iteratively searching the web and extracting pages in a strict ReAct loop. You do NOT write the final report — a dedicated synthesizer handles that.

At every turn, respond with ONLY a single, valid JSON object. Do NOT wrap the JSON in markdown code fences. Start with \`{\` and end with \`}\`.

JSON Schema:
{
  "thought": "<State your remaining step budget. Reason about what information is still missing from the Research Plan, and what tool to use next.>",
  "action": {
    "tool": "web_search" | "read_url" | "finish",
    "args": { ... }
  }
}

Tools:

1) web_search
   - Purpose: Discover URLs and rich snippets.
   - Args:
     - "query": "<search string>"
     - "time_range": "<optional: 'day', 'week', 'month', 'year', or 'none'>" — match the plan's Temporal Scope
     - "include_domains": [<optional array of specific domain strings to restrict the search, e.g. ["nature.com", "arxiv.org"]>]

2) read_url
   - Purpose: Extract the full text of a highly promising URL discovered via web_search.
   - Args: { "url": "<exact full url>" }
   - Strategy: Use sparingly. Only read URLs that appear authoritative and critical to answering a Key Question. Do not re-read the same URL.

3) finish
   - Purpose: Signal that you have gathered enough evidence to satisfy the Research Plan.
   - Args: { "ready": true }
   - Do NOT include a "report" field. Do NOT write Markdown here.

Mandatory Protocol:
- You MUST call \`web_search\` at least 2 times AND \`read_url\` at least 1 time before calling \`finish\`. Early finish attempts will be rejected.
- Absolute grounding: do not invent facts or URLs. Every claim in the final report will be grounded in your gathered observations.
- Budget awareness: your remaining step count is injected each turn. Restate it in "thought" and wrap up as it approaches zero. If it hits 0, you MUST call \`finish\`.

Output ONLY valid JSON. Start with \`{\` and end with \`}\`.`;

export function buildInitialUserMessage(query: string, maxSteps: number): string {
  return `Research question:\n${query}\n\nYou have a maximum of ${maxSteps} tool steps before you must call finish. Begin.`;
}

export function buildSearchObservation(
  query: string,
  results: Array<{ url: string; title: string; content: string }>,
): string {
  if (results.length === 0) {
    return `Observation (web_search "${query}"): no results.`;
  }
  const formatted = results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Snippet: ${r.content.slice(0, 600)}`,
    )
    .join("\n\n");
  return `Observation (web_search "${query}"):\n\n${formatted}`;
}

export function buildReadObservation(url: string, content: string): string {
  return `Observation (read_url ${url}):\n\n${content}`;
}

export function buildBudgetWarning(remaining: number): string {
  if (remaining <= 0) {
    return `System: Step budget exhausted (0 steps remaining). You MUST respond with the "finish" action now.`;
  }
  return `System: ${remaining} tool step(s) remaining before you are forced to finish.`;
}

export function buildStepCounter(currentStep: number, maxSteps: number): string {
  return `System: This is step ${currentStep} of ${maxSteps}. Restate your remaining budget (${Math.max(0, maxSteps - currentStep + 1)} steps left) inside "thought" and decide accordingly.`;
}

// ----------------------------------------------------------------------------
// Dedicated synthesis prompt (separate LLM call after the ReAct loop finishes)
// ----------------------------------------------------------------------------

export const SYNTHESIS_SYSTEM_PROMPT = `You are an expert research analyst. Your job is to write a comprehensive, authoritative Markdown report based strictly on the provided <plan> and <sources>.

<rules>
1. Structural Compliance: You MUST use the exact section headers defined in the <plan> "Report Structure". Render them as \`##\` headings in the order given.
2. Absolute Grounding: You may ONLY use facts, numbers, and claims present in the <sources> block. If the sources are insufficient to answer a section, state: "Available sources do not provide sufficient data on this point."
3. Strict Citations: Every non-trivial claim MUST be supported by an inline Markdown citation using exactly this format: [Source Title](URL).
   - You may ONLY use URLs explicitly present in the <sources> block. Do not hallucinate links. Before emitting a citation, verify the URL appears verbatim in <sources>.
   - FORBIDDEN formats: [1], [2], 【n†Lx】, [oai_citation:...], parenthetical "(Source: X)", or trailing bibliography lists keyed by number. All citations must be inline Markdown links at the point of the claim.
4. Tone: Objective, analytical, executive. Open with a brief Executive Summary heading, then the plan's sections, then a brief Conclusion.
5. Output ONLY raw Markdown. No JSON, no code fences around the whole report, no preamble like "Here is the report".
</rules>`;

export type SynthesisSource = { url: string; title: string; content: string };

export function buildSynthesisUserMessage(
  query: string,
  plan: string | null,
  searchSources: SynthesisSource[],
  readPages: SynthesisSource[],
): string {
  const planBlock = plan
    ? plan
    : "(no plan provided — infer a reasonable Report Structure from the question)";

  const searchBlock =
    searchSources.length > 0
      ? searchSources
          .map(
            (s, i) =>
              `[Search Source ${i + 1}]\nTitle: ${s.title}\nURL: ${s.url}\nSnippet: ${s.content.slice(0, 800)}`,
          )
          .join("\n\n")
      : "(no search snippets gathered)";

  const readBlock =
    readPages.length > 0
      ? readPages
          .map(
            (p, i) =>
              `[Read Page ${i + 1}]\nTitle: ${p.title || p.url}\nURL: ${p.url}\nExtracted content:\n${p.content}`,
          )
          .join("\n\n---\n\n")
      : "(no pages were read in full)";

  return `<question>
${query}
</question>

<plan>
${planBlock}
</plan>

<sources>
## Search snippets

${searchBlock}

---

## Full-text read pages

${readBlock}
</sources>

Take a deep breath and synthesize the report now.`;
}
