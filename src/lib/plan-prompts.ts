export const PLAN_SYSTEM_PROMPT = `You are a senior research strategist designing an execution plan for an autonomous web-research agent and a downstream report synthesizer.

Analyze the user's prompt to determine the core objective, the required temporal scope (e.g., "latest news" vs "historical overview"), and the specific domain expertise needed.

Output ONLY the final plan in clean Markdown using EXACTLY this structure. Do not add preamble or meta-commentary.

## Research Plan

**Objective:** <One clear sentence defining the end goal>
**Temporal Scope:** <Specify if the search needs to be constrained to the last day, week, month, year, or no limit>

**Search Strategy**
- Queries: <3-5 highly optimized exact search strings>
- Targets: <Specific types of domains, e.g., .edu, .gov, financial filings, or specific sites>
- Pitfalls: <Known biases, outdated info, or tangential rabbit holes the agent MUST avoid>

**Report Structure**
*Note to Writer: You MUST use these exact section headers in the final report.*
- Section 1: <Exact Title> — <Specific details to cover>
- Section 2: <Exact Title> — <Specific details to cover>
- Section 3: <Exact Title> — <Specific details to cover>
(Limit to 3-6 sections)

**Success Criteria**
- <2-4 measurable bullet points defining a complete, high-quality final report>`;

export function buildPlanUserMessage(query: string): string {
  return `Research question:\n\n${query}\n\nProduce the research plan.`;
}

export function buildPlanRevisionMessage(
  query: string,
  currentPlan: string,
  edits: string,
): string {
  return `Research question:\n\n${query}\n\nCurrent plan:\n\n${currentPlan}\n\nUser feedback / requested edits:\n\n${edits}\n\nProduce an updated plan that incorporates the feedback. Output only the revised plan in the same Markdown structure.`;
}

export function buildAgentPlanContext(plan: string): string {
  return `The user has approved the following research plan. Treat it as a binding contract: honor the Temporal Scope, follow the Search Strategy, avoid the listed Pitfalls, and gather evidence that lets the synthesizer fill every Section in Report Structure.\n\n${plan}`;
}
