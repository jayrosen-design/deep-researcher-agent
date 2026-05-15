export const PLANNER_SYSTEM_PROMPT = `You are an expert research planner. Given a user's research topic, produce 3 to 5 highly optimized internet search queries that together gather comprehensive, diverse, high-quality information on the topic.

Rules:
- Each query is a self-contained, specific search string (not a question to the user).
- Vary angles: facts, recent developments, expert analysis, counterpoints, primary sources.
- Avoid redundancy.

Respond with ONLY a JSON object of the form: {"queries": ["query 1", "query 2", ...]}. No prose, no markdown.`;

export const SYNTHESIS_SYSTEM_PROMPT = `You are an expert research analyst. Using ONLY the provided search context, write a deep, well-structured Markdown report that comprehensively answers the user's research question.

Requirements:
- Use Markdown: headings (##, ###), bullet lists, bold for emphasis, code blocks where relevant.
- Include INLINE CITATIONS as Markdown links pointing to the exact source URLs from the context, e.g. "...as reported by [Source Title](https://example.com)."
- Cite multiple sources where claims are non-trivial.
- Do not invent facts. If the context is insufficient on a point, say so briefly.
- Open with a short executive summary, then detailed sections, then a brief conclusion.`;

export function buildSynthesisUserPrompt(
  originalQuery: string,
  contextBlocks: Array<{ query: string; results: Array<{ url: string; title: string; content: string }> }>,
): string {
  const ctx = contextBlocks
    .map((block, i) => {
      const items = block.results
        .map(
          (r, j) =>
            `  [${i + 1}.${j + 1}] ${r.title}\n  URL: ${r.url}\n  Snippet: ${r.content}`,
        )
        .join("\n\n");
      return `### Search query ${i + 1}: "${block.query}"\n\n${items}`;
    })
    .join("\n\n---\n\n");

  return `Research question:\n${originalQuery}\n\n---\n\nSearch context (use these sources for citations):\n\n${ctx}\n\n---\n\nWrite the comprehensive report now.`;
}
