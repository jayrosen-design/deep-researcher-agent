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

export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  // de-dupe, strip trailing punctuation
  const cleaned = matches.map((u) => u.replace(/[.,;:!?)\]]+$/, ""));
  return Array.from(new Set(cleaned));
}

export function buildInitialUserMessage(query: string, maxSteps: number): string {
  const urls = extractUrls(query);
  const urlDirective =
    urls.length > 0
      ? `\n\nThe user's question contains ${urls.length === 1 ? "a URL" : "URLs"}. Your FIRST action MUST be to \`read_url\` ${urls.length === 1 ? "that URL" : "each of those URLs (one per step)"} before running any web_search. URLs to read first:\n${urls.map((u) => `- ${u}`).join("\n")}`
      : "";
  return `Research question:\n${query}\n\nYou have a maximum of ${maxSteps} tool steps before you must call finish.${urlDirective}\n\nBegin.`;
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

// Cap per-observation size so the rolling ReAct message history doesn't blow
// past the investigator model's context window (e.g. llama-3.1-8b has 32k).
// The full page content is still stored in `readPages` and handed to the
// synthesizer separately — this only trims what the investigator re-sees.
const READ_OBSERVATION_CHAR_LIMIT = 4000;

export function buildReadObservation(url: string, content: string): string {
  const trimmed =
    content.length > READ_OBSERVATION_CHAR_LIMIT
      ? content.slice(0, READ_OBSERVATION_CHAR_LIMIT) +
        `\n\n[…truncated ${content.length - READ_OBSERVATION_CHAR_LIMIT} chars — full text saved for the final report]`
      : content;
  return `Observation (read_url ${url}):\n\n${trimmed}`;
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

export const SYNTHESIS_SYSTEM_PROMPT = `You are an expert research analyst. Your job is to write a comprehensive, in-depth, authoritative Markdown report based strictly on the provided <plan> and <sources>.

<rules>
1. Structural Compliance: You MUST use the exact section headers defined in the <plan> "Report Structure". Render them as \`##\` headings in the order given.
2. Depth & Length: This is a long-form research report, NOT a summary. Aim for roughly 2,500–5,000 words of substantive prose. Every \`##\` section must contain multiple well-developed paragraphs (typically 3–6 paragraphs, ~200–500 words each) that explain, compare, contextualize, and analyze — not just list links. Use \`###\` subsections, tables, and bullet lists where they add clarity, but the backbone must be flowing analytical prose. Do NOT pad with filler; expand by drawing more detail, nuance, numbers, named entities, dates, mechanisms, and trade-offs out of the sources.
3. Synthesize, don't link-dump: Integrate facts from MULTIPLE sources into each paragraph. A paragraph that is just one sentence followed by a citation is unacceptable. Compare and reconcile sources; call out agreements, disagreements, and gaps.
4. Absolute Grounding: You may ONLY use facts, numbers, and claims present in the <sources> block. If the sources are genuinely insufficient for a section, write what IS supported (at least a paragraph) and then briefly note the gap — do not skip the section.
5. Strict Citations: Every non-trivial claim MUST be supported by an inline Markdown citation using exactly this format: [Source Title](URL).
   - You may ONLY use URLs explicitly present in the <sources> block. Do not hallucinate links. Before emitting a citation, verify the URL appears verbatim in <sources>.
   - FORBIDDEN formats: [1], [2], 【n†Lx】, [oai_citation:...], parenthetical "(Source: X)", or trailing bibliography lists keyed by number. All citations must be inline Markdown links at the point of the claim.
   - Do NOT cluster all citations at the end of a paragraph or section — distribute them naturally next to the specific claims they support.
6. Tone: Objective, analytical, executive. Open with an "## Executive Summary" section (3–5 substantive paragraphs hitting the most important findings), then the plan's sections in order, then a "## Conclusion" section that synthesizes implications and open questions.
7. Output ONLY raw Markdown. No JSON, no code fences around the whole report, no preamble like "Here is the report".
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

// ----------------------------------------------------------------------------
// Review pass: synthesizer reviews its own draft, polishes it, and proposes
// follow-up research directions.
// ----------------------------------------------------------------------------

export const REVIEW_SYSTEM_PROMPT = `You are the same expert research analyst returning for a final review pass over your own draft report.

Do TWO things:

1. Polish the report. Fix awkward prose, tighten transitions, remove redundancy, correct obvious factual or citation inconsistencies, and ensure the section headers from the plan are honored. Do NOT invent new facts or citations — you may only use URLs that already appear in the draft. Keep the report's overall length and depth; this is an editing pass, not a rewrite.

2. Identify gaps. Based on the original question, the plan, and what the draft actually covers, propose 3 high-value follow-up research prompts that would fill the most important missing pieces. Each follow-up must be a complete, standalone research prompt (1–3 sentences, in the same voice as the original question) that another researcher could submit as-is.

Respond with ONLY a single valid JSON object — no markdown fences, no preamble:

{
  "revisedReport": "<full revised Markdown report, same structure and citation style as the draft>",
  "followUps": [
    { "title": "<6–10 word label>", "rationale": "<1 sentence on the gap this fills>", "prompt": "<the ready-to-submit research prompt>" },
    { "title": "...", "rationale": "...", "prompt": "..." },
    { "title": "...", "rationale": "...", "prompt": "..." }
  ]
}

Start with \`{\` and end with \`}\`. No other text.`;

export function buildReviewUserMessage(
  query: string,
  plan: string | null,
  draftReport: string,
): string {
  const planBlock = plan ?? "(no plan provided)";
  return `<original_question>
${query}
</original_question>

<plan>
${planBlock}
</plan>

<draft_report>
${draftReport}
</draft_report>

Polish the draft and propose 3 follow-up research prompts. Respond with the JSON object only.`;
}

export type FollowUpSuggestion = {
  title: string;
  rationale: string;
  prompt: string;
};
