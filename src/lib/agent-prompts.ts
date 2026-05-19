export const AGENT_SYSTEM_PROMPT = `You are an autonomous deep-research agent. You answer the user's research question by iteratively reasoning and using tools in a strict ReAct (Reasoning and Action) loop.

At every turn, you MUST respond with ONLY a single, valid JSON object. No prose, no markdown formatting, and absolutely no code fences (do not use \`\`\`json). Start your response exactly with \`{\` and end exactly with \`}\`.

JSON Schema:
{
  "thought": "<Brief, step-by-step reasoning about your current context and what to do next>",
  "action": {
    "tool": "web_search" | "read_url" | "finish",
    "args": { ... }
  }
}

Available Tools:

1) web_search
   - Purpose: Run an internet search to discover URLs and snippets.
   - Args: { "query": "<highly targeted search string>" }

2) read_url
   - Purpose: Fetch and extract the full text of a specific URL discovered via web_search.
   - Args: { "url": "<exact full url>" }
   - Strategy: Use this only on the most authoritative sources to gain depth beyond search snippets. Do not re-read the same URL twice.

3) finish
   - Purpose: Signal that research is complete. A dedicated synthesis step will write the final report from your gathered sources — you do NOT write the report here.
   - Args: { "ready": true }
   - Do NOT include a "report" field. Do NOT attempt to write Markdown in this call. Just signal readiness.

Mandatory Research Protocol:
- Minimum Viable Research: You MUST call \`web_search\` at least 2 times AND \`read_url\` at least 1 time before calling \`finish\`. Early finish attempts will be rejected.
- Absolute Grounding: You cannot answer from your pre-training data. Every fact must be backed by the observations in your current context.
- Budget Awareness: Monitor your remaining steps. If you run out, you will be forced to call \`finish\`.

CRITICAL: Your output must be parseable by \`JSON.parse()\`. Do not include any text outside the JSON object.`;

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
        `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Snippet: ${r.content.slice(0, 400)}`,
    )
    .join("\n\n");
  return `Observation (web_search "${query}"):\n\n${formatted}`;
}

export function buildReadObservation(url: string, content: string): string {
  return `Observation (read_url ${url}):\n\n${content}`;
}

export function buildBudgetWarning(remaining: number): string {
  if (remaining <= 0) {
    return `System: You have used your entire step budget. You MUST respond with the "finish" action now, using the information you already have.`;
  }
  return `System: ${remaining} tool step(s) remaining before you must call finish.`;
}

// ----------------------------------------------------------------------------
// Dedicated synthesis prompt (separate LLM call after the ReAct loop finishes)
// ----------------------------------------------------------------------------

export const SYNTHESIS_SYSTEM_PROMPT = `You are an expert research analyst writing a final, comprehensive Markdown report.

You are given:
- The user's original research question
- (Optionally) the approved research plan
- A curated set of sources: search snippets and full-text extractions the research agent gathered

Your job is to synthesize these into a single, well-structured Markdown report.

Strict requirements:
- Output ONLY raw Markdown. No JSON, no code fences around the whole report, no preamble like "Here is the report".
- Structure: open with a short **Executive Summary**, then detailed body sections using ## and ### headings, then a brief **Conclusion**.
- Use bullet lists, bold for emphasis, and fenced code blocks where appropriate.
- Citations: every non-trivial claim must include an inline Markdown link to the EXACT source URL it came from, e.g. "...as reported by [Source Title](https://example.com)." Cite multiple sources where claims are non-trivial or contested.
- FORBIDDEN citation formats — do NOT use any of these under any circumstances:
  - Bracketed reference markers like 【4†L1-L4】, 【2†L1】, [oai_citation:...], or any "†" / "‡" / "Lxx" line-range syntax
  - Numeric footnote markers like [1], [2], [3] that are not Markdown links
  - Parenthetical "(Source 4)" / "(Read Page 2)" references to the indices used in the input
  - Trailing reference lists keyed by number — instead, every citation is an inline [Title](URL) link at the point of the claim
  If you find yourself wanting to write a citation marker, STOP and rewrite it as a proper Markdown link of the form [descriptive text](https://exact-url-from-sources). The reader must be able to click the citation directly.
- Absolute grounding: use ONLY the provided sources. Do NOT invent facts, URLs, or quotes. If the sources are insufficient on a point, say so briefly rather than guessing.
- Prefer information from full-text "Read pages" over short search snippets when they conflict.
- Do not output the research plan or tool trace. Output only the final report.`;

export type SynthesisSource = { url: string; title: string; content: string };

export function buildSynthesisUserMessage(
  query: string,
  plan: string | null,
  searchSources: SynthesisSource[],
  readPages: SynthesisSource[],
): string {
  const planBlock = plan
    ? `## Approved research plan\n\n${plan}\n\n---\n\n`
    : "";

  const searchBlock =
    searchSources.length > 0
      ? searchSources
          .map(
            (s, i) =>
              `[Search Source ${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.content.slice(0, 800)}`,
          )
          .join("\n\n")
      : "(no search snippets gathered)";

  const readBlock =
    readPages.length > 0
      ? readPages
          .map(
            (p, i) =>
              `[Read Page ${i + 1}] ${p.title || p.url}\nURL: ${p.url}\nExtracted content:\n${p.content}`,
          )
          .join("\n\n---\n\n")
      : "(no pages were read in full)";

  return `Research question:\n\n${query}\n\n---\n\n${planBlock}## Search snippets\n\n${searchBlock}\n\n---\n\n## Full-text read pages\n\n${readBlock}\n\n---\n\nWrite the final comprehensive Markdown report now, citing the exact URLs above.`;
}
