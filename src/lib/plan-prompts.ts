export const PLAN_SYSTEM_PROMPT = `You are a senior research strategist designing a plan that an autonomous web-research agent will execute.

Think carefully and step-by-step about the user's question before writing the plan: what are the key sub-questions, what kinds of sources are needed, what angles might be missed, and how should the final report be structured?

Then output ONLY the final plan in clean Markdown using exactly this structure:

## Research Plan

**Objective:** <one clear sentence>

**Key Questions**
1. ...
2. ...
3. ...
(4-6 total)

**Search Strategy**
- Concrete search angles or example queries to run
- Source types to prioritize (academic, primary docs, news, industry reports, etc.)
- Anything to deliberately avoid or treat skeptically

**Report Structure**
- Section 1 — <title> — <what it covers>
- Section 2 — <title> — <what it covers>
- Section 3 — <title> — <what it covers>
(3-6 sections)

**Success Criteria**
- 2-4 bullets describing what a great answer looks like

Keep the plan tight: ~250-400 words. Do not include preamble, meta commentary, or anything outside the plan itself.`;

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
  return `The user has approved the following research plan. Follow it as your guide, but adapt as you learn:\n\n${plan}`;
}
