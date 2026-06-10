import type { UserRoleId } from "./research-templates";

export type MoeExpertId = UserRoleId;

export const MOE_EXPERT_IDS: MoeExpertId[] = [
  "researcher",
  "school-teacher",
  "higher-education-instructor",
  "instructional-designer",
  "education-leader",
  "experience-designer",
  "software-developer",
  "communications-marketing",
  "business-operations",
];

export const MOE_EXPERT_LABELS: Record<MoeExpertId, string> = {
  researcher: "Researcher",
  "school-teacher": "School Teacher",
  "higher-education-instructor": "Higher-Ed Instructor",
  "instructional-designer": "Instructional Designer",
  "education-leader": "Education Leader",
  "experience-designer": "Experience Designer",
  "software-developer": "Software Developer",
  "communications-marketing": "Communications & Marketing",
  "business-operations": "Business & Operations",
};

export type PanelPresetId =
  | "education"
  | "higher-education"
  | "product-design"
  | "implementation-strategy"
  | "technical-feasibility"
  | "default";

export const MOE_PANEL_PRESETS: Record<PanelPresetId, MoeExpertId[]> = {
  education: ["researcher", "school-teacher", "instructional-designer", "education-leader"],
  "higher-education": [
    "researcher",
    "higher-education-instructor",
    "instructional-designer",
    "experience-designer",
  ],
  "product-design": [
    "experience-designer",
    "software-developer",
    "communications-marketing",
    "business-operations",
  ],
  "implementation-strategy": [
    "researcher",
    "education-leader",
    "business-operations",
    "communications-marketing",
  ],
  "technical-feasibility": [
    "researcher",
    "software-developer",
    "experience-designer",
    "business-operations",
  ],
  default: [
    "researcher",
    "experience-designer",
    "software-developer",
    "business-operations",
  ],
};

export const MOE_PANEL_PRESET_META: Record<
  PanelPresetId,
  { label: string; bestFor: string; description: string }
> = {
  education: {
    label: "Education Panel",
    bestFor:
      "K-12 learning, classroom use, curriculum decisions, instructional strategy, school implementation.",
    description:
      "Evaluates research through classroom practice, learning design, and education leadership perspectives.",
  },
  "higher-education": {
    label: "Higher Education Panel",
    bestFor:
      "College teaching, online courses, academic integrity, student engagement, course design, and assessment.",
    description:
      "Combines research evidence, university teaching practice, learning design, and student experience.",
  },
  "product-design": {
    label: "Product Design Panel",
    bestFor:
      "Turning research into an app, website, platform, prototype, or user-facing product.",
    description:
      "Reviews the idea from UX, technical feasibility, audience positioning, and operational sustainability.",
  },
  "implementation-strategy": {
    label: "Implementation Strategy Panel",
    bestFor:
      "Adoption planning, stakeholder buy-in, funding, rollout strategy, policy alignment, and organizational change.",
    description:
      "Translates research into a practical implementation plan with leadership, communication, and operational considerations.",
  },
  "technical-feasibility": {
    label: "Technical Feasibility Panel",
    bestFor:
      "Evaluating whether an idea can realistically be built, scaled, maintained, and supported.",
    description:
      "Assesses evidence, system architecture, user experience, cost, staffing, privacy, security, and long-term maintainability.",
  },
  default: {
    label: "Default Panel",
    bestFor: "General multi-perspective analysis.",
    description:
      "Balanced cross-functional panel covering research, UX, engineering, and operations.",
  },
};

export const PANEL_PRESET_ORDER: PanelPresetId[] = [
  "education",
  "higher-education",
  "product-design",
  "implementation-strategy",
  "technical-feasibility",
  "default",
];

export const MOE_ROUTER_SYSTEM_PROMPT = `You are an expert router inside Deep Researcher Agent.

The user has completed a deep research report and is now asking a follow-up question. Select the best expert personas to answer.

Available experts:
- researcher
- school-teacher
- higher-education-instructor
- instructional-designer
- education-leader
- experience-designer
- software-developer
- communications-marketing
- business-operations

Rules:
- Select 1 to 3 experts for normal questions.
- Select 4 to 6 experts only when the user asks for a panel, debate, implementation plan, or multi-perspective analysis.
- Prefer the user's selected persona if it is relevant.
- Do not select experts just to be comprehensive.
- Return only valid JSON.

JSON format:
{
  "routes": [
    {
      "expertId": "researcher",
      "reason": "This question requires evidence synthesis and source evaluation.",
      "priority": 1
    }
  ]
}`;

export const MOE_EXPERT_ANSWER_INSTRUCTIONS = `You are now answering as the selected expert persona inside Deep Researcher Agent.

You will receive:
- The original research question.
- The completed report.
- The selected sources (grounded knowledge base).
- The user's follow-up question.

Your job:
- Answer only from your expert perspective.
- Use the completed report and selected sources as the primary knowledge base.
- Use your professional expertise to interpret, organize, and apply the report.
- Do not invent facts or citations.
- If evidence is missing, say what is missing.
- Separate source-grounded findings from expert judgment.

Return ONLY valid JSON in this exact shape:
{
  "expertId": "<your expert id>",
  "answer": "<markdown answer, may include inline [n](URL) citations>",
  "confidence": "high" | "medium" | "low",
  "evidenceUsed": ["short bullet points about which report findings/sources you relied on"],
  "missingEvidence": ["short bullet points about what the report/sources do not answer"],
  "recommendations": ["short actionable bullet points from your expert perspective"]
}`;

export const MOE_MODERATOR_SYSTEM_PROMPT = `You are the moderator of a post-report expert panel inside Deep Researcher Agent.

You will receive:
- The user's follow-up question.
- The completed report.
- The selected sources.
- Several expert responses (each with expertId, answer, confidence, evidenceUsed, missingEvidence, recommendations).

Your job:
- Synthesize the expert responses into one clear final answer.
- Preserve important disagreements between experts.
- Identify the strongest recommendation.
- Explain trade-offs.
- Cite only provided sources (inline Markdown links [n](URL)).
- Do not invent facts.
- Distinguish source-grounded findings from expert judgment.

Use this Markdown response structure, with these exact headings:

## Direct Answer
A concise, plain answer to the user's question (2–4 sentences).

## Expert Panel Synthesis
A short integrated synthesis of what the experts collectively concluded.

## Trade-offs
Bullet list of the most important trade-offs, tensions, or disagreements between experts.

## Recommended Next Step
The single strongest recommended action the user should take next.

## Evidence Gaps
Bullet list of what the report/sources do NOT answer and that the user would need to investigate further.

## Expert Contributions
A one-line summary per participating expert (e.g. "**Researcher** — flagged limited replication of the core claim.").`;

export type RouterRoute = {
  expertId: MoeExpertId;
  reason: string;
  priority: number;
};

export type ExpertAnswer = {
  expertId: MoeExpertId;
  answer: string;
  confidence: "high" | "medium" | "low";
  evidenceUsed: string[];
  missingEvidence: string[];
  recommendations: string[];
};

export function isMoeExpertId(v: unknown): v is MoeExpertId {
  return typeof v === "string" && (MOE_EXPERT_IDS as string[]).includes(v);
}

export function buildExpertContextBlock(args: {
  originalQuery: string;
  compiledReport: string;
  sources: Array<{ title: string; url: string; content?: string; snippet?: string }>;
}): string {
  const sourcesBlock = args.sources
    .map(
      (s, i) =>
        `[Source ${i + 1}]\nTitle: ${s.title}\nURL: ${s.url}\nContent:\n${
          s.content ?? s.snippet ?? "(no excerpt provided)"
        }`,
    )
    .join("\n\n---\n\n");

  return `Original research question:
${args.originalQuery}

Compiled report:
${args.compiledReport}

Selected sources:
${sourcesBlock || "(no sources provided)"}`;
}

export function buildRouterUserMessage(args: {
  context: string;
  userQuestion: string;
  preferredExpertId?: MoeExpertId;
}): string {
  return `${args.context}

User follow-up question:
${args.userQuestion}

${
  args.preferredExpertId
    ? `The user originally chose the "${args.preferredExpertId}" persona for this research. Prefer that expert if relevant.`
    : ""
}

Return ONLY the JSON object described in the system prompt.`;
}

export function buildExpertUserMessage(args: {
  expertId: MoeExpertId;
  context: string;
  userQuestion: string;
}): string {
  return `${args.context}

User follow-up question:
${args.userQuestion}

You are answering as expertId="${args.expertId}". Return ONLY the JSON object described above.`;
}

export function buildModeratorUserMessage(args: {
  context: string;
  userQuestion: string;
  expertAnswers: ExpertAnswer[];
}): string {
  const expertBlock = args.expertAnswers
    .map(
      (e) =>
        `=== Expert: ${MOE_EXPERT_LABELS[e.expertId] ?? e.expertId} (${e.expertId}) ===
Confidence: ${e.confidence}
Answer:
${e.answer}

Evidence used:
${e.evidenceUsed.map((x) => `- ${x}`).join("\n") || "- (none)"}

Missing evidence:
${e.missingEvidence.map((x) => `- ${x}`).join("\n") || "- (none)"}

Recommendations:
${e.recommendations.map((x) => `- ${x}`).join("\n") || "- (none)"}`,
    )
    .join("\n\n");

  return `${args.context}

User follow-up question:
${args.userQuestion}

Expert responses:
${expertBlock}

Synthesize these expert responses using the exact Markdown structure described in the system prompt.`;
}
