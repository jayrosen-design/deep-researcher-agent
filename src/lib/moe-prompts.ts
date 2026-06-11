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
];

export const MOE_PANEL_PRESET_IMAGES: Record<PanelPresetId, string> = {
  education: "/moe/education-moe.png",
  "higher-education": "/moe/higher-ed-moe.png",
  "product-design": "/moe/product-design-moe.png",
  "implementation-strategy": "/moe/implementation-strategy-moe.png",
  "technical-feasibility": "/moe/technical-feasibility-moe.png",
  default: "/moe/product-design-moe.png",
};

export type MoePanelTemplate = { id: string; label: string; description: string; prompt: string };

export const MOE_PANEL_TEMPLATES: Record<Exclude<PanelPresetId, "default">, MoePanelTemplate[]> = {
  education: [
    {
      id: "edu-evaluate",
      label: "Evaluate [TOPIC] for classroom use",
      description:
        "Research support, real K-12 classroom fit, instructional design, and leader considerations.",
      prompt:
        "Evaluate [TOPIC] for classroom use.\nDiscuss whether [TOPIC] is supported by the research, how it would work in a real K-12 classroom, what instructional design considerations matter, and what school leaders should consider before adopting it.",
    },
    {
      id: "edu-implementation",
      label: "Create a practical classroom implementation plan for [TOPIC]",
      description:
        "Grade level, subject, student needs, workload, materials, assessment, and rollout steps.",
      prompt:
        "Create a practical classroom implementation plan for [TOPIC].\nFocus on grade level [GRADE LEVEL], subject area [SUBJECT], student needs [STUDENT NEEDS], teacher workload, materials, assessment, and rollout steps.",
    },
    {
      id: "edu-risks",
      label: "Biggest risks and limitations of using [TOPIC] in schools",
      description:
        "Evidence gaps, classroom barriers, equity, accessibility, families, policy, and implementation.",
      prompt:
        "What are the biggest risks and limitations of using [TOPIC] in schools?\nAnalyze evidence gaps, classroom barriers, equity concerns, accessibility, family communication, policy issues, and implementation challenges.",
    },
    {
      id: "edu-recommendations",
      label: "Turn this research on [TOPIC] into recommendations for educators",
      description:
        "Recommendations for teachers, designers, and leaders: do now, pilot, and needs more evidence.",
      prompt:
        "Turn this research on [TOPIC] into recommendations for educators.\nProvide clear recommendations for teachers, instructional designers, and education leaders, with separate sections for what to do now, what to pilot, and what needs more evidence.",
    },
  ],
  "higher-education": [
    {
      id: "he-evaluate",
      label: "Evaluate [TOPIC] for college or university teaching",
      description:
        "Evidence, course design, assessment, student experience, accessibility, instructor workload.",
      prompt:
        "Evaluate [TOPIC] for college or university teaching.\nDiscuss the evidence, course design implications, assessment concerns, student experience, accessibility, and instructor workload.",
    },
    {
      id: "he-activity",
      label: "Design a higher education learning activity around [TOPIC]",
      description:
        "Course, student level, modality, learning goal, and assessment type.",
      prompt:
        "Design a higher education learning activity around [TOPIC].\nUse this context: course [COURSE NAME], student level [UNDERGRAD/GRAD], modality [IN-PERSON/ONLINE/HYBRID], learning goal [LEARNING GOAL], and assessment type [ASSESSMENT].",
    },
    {
      id: "he-integrate",
      label: "How should instructors responsibly integrate [TOPIC] into a course?",
      description:
        "Academic integrity, engagement, outcomes, equity, accessibility, feedback, and constraints.",
      prompt:
        "How should instructors responsibly integrate [TOPIC] into a course?\nAddress academic integrity, student engagement, learning outcomes, equity, accessibility, feedback, and realistic implementation constraints.",
    },
    {
      id: "he-brief",
      label: "Create a faculty-facing guidance brief for [TOPIC]",
      description:
        "What faculty need to know, evidence, risks to avoid, and how to pilot.",
      prompt:
        "Create a faculty-facing guidance brief for [TOPIC].\nSummarize what faculty need to know, what the evidence supports, what risks to avoid, and how to pilot this in a course or program.",
    },
  ],
  "product-design": [
    {
      id: "pd-concept",
      label: "Turn [TOPIC] into a product concept",
      description:
        "Users, core journey, key features, technical feasibility, positioning, and operations.",
      prompt:
        "Turn [TOPIC] into a product concept.\nDiscuss the target users, core user journey, key features, technical feasibility, market positioning, and operational requirements.",
    },
    {
      id: "pd-ux-strategy",
      label: "Evaluate the UX and product strategy for [TOPIC]",
      description:
        "Audience, pain points, goal, product format, and success metrics.",
      prompt:
        "Evaluate the user experience and product strategy for [TOPIC].\nFocus on audience [AUDIENCE], user pain points [PAIN POINTS], desired outcome [GOAL], product format [APP/WEBSITE/TOOL/SERVICE], and success metrics [METRICS].",
    },
    {
      id: "pd-mvp",
      label: "What should the MVP for [TOPIC] include?",
      description:
        "Smallest useful version, essential features, flows, architecture, messaging, costs.",
      prompt:
        "What should the MVP for [TOPIC] include?\nIdentify the smallest useful version, essential features, user flows, technical architecture, messaging, cost considerations, and what should be deferred.",
    },
    {
      id: "pd-launch",
      label: "Create a product launch plan for [TOPIC]",
      description:
        "UX priorities, build phases, messaging, onboarding, support, ops risks, and metrics.",
      prompt:
        "Create a product launch plan for [TOPIC].\nInclude UX priorities, technical build phases, audience messaging, onboarding, support needs, operational risks, and launch success metrics.",
    },
  ],
  "implementation-strategy": [
    {
      id: "imp-strategy",
      label: "Create an implementation strategy for [TOPIC]",
      description:
        "Evidence, buy-in, policy alignment, cost, staffing, comms, rollout phases, and metrics.",
      prompt:
        "Create an implementation strategy for [TOPIC].\nDiscuss evidence strength, stakeholder buy-in, policy alignment, cost, staffing, communication strategy, rollout phases, and evaluation metrics.",
    },
    {
      id: "imp-adopt",
      label: "Should an organization adopt [TOPIC]?",
      description:
        "Benefits, risks, resources, leadership concerns, ops burden, comms, and evidence gaps.",
      prompt:
        "Should an organization adopt [TOPIC]?\nAnalyze benefits, risks, required resources, leadership concerns, operational burden, communication needs, and what evidence is still missing.",
    },
    {
      id: "imp-pilot",
      label: "Design a pilot program for [TOPIC]",
      description:
        "Goals, setting, participants, timeline, budget, success metrics, and scale criteria.",
      prompt:
        "Design a pilot program for [TOPIC].\nInclude pilot goals [GOALS], setting [SETTING], participants [PARTICIPANTS], timeline [TIMELINE], budget constraints [BUDGET], success metrics, and decision criteria for scaling.",
    },
    {
      id: "imp-briefing",
      label: "Prepare a stakeholder briefing on [TOPIC]",
      description:
        "Leadership-ready summary of why it matters, evidence, who is affected, risks, next steps.",
      prompt:
        "Prepare a stakeholder briefing on [TOPIC].\nCreate a leadership-ready summary explaining why it matters, what the evidence says, who is affected, what risks exist, and what next steps should be approved.",
    },
  ],
  "technical-feasibility": [
    {
      id: "tf-evaluate",
      label: "Evaluate the technical feasibility of [TOPIC]",
      description:
        "Evidence, what can be built, architecture, UX, cost, staffing, privacy, security, maintenance.",
      prompt:
        "Evaluate the technical feasibility of [TOPIC].\nDiscuss what the evidence supports, what can realistically be built, architecture options, UX constraints, cost, staffing, privacy, security, and maintenance.",
    },
    {
      id: "tf-build-plan",
      label: "Create a build plan for [TOPIC]",
      description:
        "Users, features, platform, data, integrations, constraints, and development phases.",
      prompt:
        "Create a build plan for [TOPIC].\nInclude target users [USERS], core features [FEATURES], platform [PLATFORM], data needs [DATA], integrations [INTEGRATIONS], constraints [CONSTRAINTS], and recommended development phases.",
    },
    {
      id: "tf-risks",
      label: "Technical and operational risks of [TOPIC]",
      description:
        "Complexity, scalability, security, privacy, accessibility, vendor lock-in, maintenance, costs.",
      prompt:
        "What are the technical and operational risks of [TOPIC]?\nAnalyze system complexity, scalability, security, privacy, accessibility, vendor dependency, maintenance burden, user adoption, and hidden costs.",
    },
    {
      id: "tf-mvp-arch",
      label: "Define an MVP and architecture for [TOPIC]",
      description:
        "Minimum feature set, architecture, data flow, UX, testing, staffing, validation.",
      prompt:
        "Define an MVP and architecture for [TOPIC].\nRecommend the minimum viable feature set, technical architecture, data flow, user experience, testing plan, staffing needs, and what should be validated before full development.",
    },
  ],
};




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
  reactionAnswers?: ExpertReaction[];
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

  const reactionBlock =
    args.reactionAnswers && args.reactionAnswers.length > 0
      ? `

Discussion round (each expert responding to the others' first takes):
${args.reactionAnswers
  .map(
    (r) =>
      `--- ${MOE_EXPERT_LABELS[r.expertId] ?? r.expertId} reaction ---
${r.content}`,
  )
  .join("\n\n")}`
      : "";

  return `${args.context}

User follow-up question:
${args.userQuestion}

Expert responses:
${expertBlock}${reactionBlock}

Synthesize these expert responses${
    args.reactionAnswers && args.reactionAnswers.length > 0 ? " and the discussion round" : ""
  } using the exact Markdown structure described in the system prompt.`;
}

export type ExpertReaction = {
  expertId: MoeExpertId;
  content: string;
};

export const MOE_EXPERT_REACTION_INSTRUCTIONS = `You have just seen the FIRST RESPONSES from the other experts on this panel.
Respond in 1-2 short paragraphs, in first person, as your assigned persona. You may:
- Agree with and reinforce specific points another expert made.
- Respectfully push back on something you'd frame differently.
- Build on another expert's idea with what your perspective uniquely adds.
Address other experts by their role name (e.g. "I agree with the Researcher that..."). Be concrete and brief.
Plain prose only. No headings. No JSON. No bullet lists. No preamble like "As a ...". Just the reaction.`;

export function buildExpertReactionUserMessage(args: {
  expertId: MoeExpertId;
  userQuestion: string;
  otherAnswers: ExpertAnswer[];
}): string {
  const others = args.otherAnswers
    .filter((a) => a.expertId !== args.expertId)
    .map(
      (a) =>
        `--- ${MOE_EXPERT_LABELS[a.expertId] ?? a.expertId} said ---
${a.answer}`,
    )
    .join("\n\n");

  return `User question:
${args.userQuestion}

Your own first response has already been delivered. Now react to the OTHER experts below.

${others}

Respond now as ${MOE_EXPERT_LABELS[args.expertId] ?? args.expertId}, following the reaction instructions in the system prompt.`;
}
