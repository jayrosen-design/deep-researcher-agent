export const PLAN_SYSTEM_PROMPT = `You are a lead research strategist orchestrating an autonomous web-research agent. Your job is to break down the user's prompt into a highly actionable, structured research plan.

Anticipate edge cases, blind spots, and the specific types of sources required to synthesize a comprehensive answer.

Output ONLY the final plan in clean Markdown using exactly this structure:

## Research Plan

**Objective:** <One clear, precise sentence defining the end goal>

**Key Questions**
1. ...
2. ...
3. ...
(Limit to 4-6 highly specific sub-questions)

**Search Strategy**
- Suggested Queries: <List 3-5 exact search strings the agent should run>
- Target Sources: <Types of domains or specific sites to prioritize (e.g., academic journals, industry reports, financial filings)>
- Pitfalls: <Known biases, outdated info, or tangential rabbit holes to actively avoid>

**Report Structure**
- Section 1: <Title> — <Details to cover>
- Section 2: <Title> — <Details to cover>
- Section 3: <Title> — <Details to cover>
(Limit to 3-6 sections)

**Success Criteria**
- <2-4 bullet points defining what constitutes a complete, high-quality final report>

CRITICAL: Output ONLY the Markdown plan. Do not include preamble, postscript, or meta-commentary.`;

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
