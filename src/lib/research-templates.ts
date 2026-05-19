export type ResearchTemplate = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export const RESEARCH_TEMPLATES: ResearchTemplate[] = [
  {
    id: "instructional-design-brief",
    label: "Instructional design brief",
    description: "Learning goals, audience, activities, assessment",
    prompt:
      "Create an instructional design brief for [COURSE/PROGRAM/TRAINING TOPIC] at the University of Florida College of Education. Identify the target learners, learning objectives, prerequisite knowledge, recommended instructional strategies, activity ideas, assessment approaches, accessibility considerations, and evidence-based design principles. Include examples from higher education, teacher education, or professional learning when available.",
  },
  {
    id: "edtech-tool-evaluation",
    label: "EdTech tool evaluation",
    description: "Features, evidence, cost, risks, fit",
    prompt:
      "Evaluate [EDTECH TOOL/PLATFORM] for use by UF College of Education faculty, staff, or students. Cover core features, pedagogical use cases, evidence of effectiveness, accessibility, FERPA/privacy considerations, integrations with Canvas or common university systems, licensing or cost model, implementation effort, support needs, risks, and a recommendation for whether ETC should pilot, adopt, avoid, or monitor it.",
  },
  {
    id: "ai-teaching-learning",
    label: "AI in teaching & learning",
    description: "Use cases, risks, policy, implementation",
    prompt:
      "Research how [AI TOOL/AI APPROACH] can support teaching, learning, research, or staff workflows in a College of Education context. Include practical use cases, benefits, limitations, ethical risks, privacy and data governance concerns, accessibility issues, faculty/staff training needs, student impact, examples from peer institutions, and a responsible implementation plan.",
  },
  {
    id: "xr-learning-experience",
    label: "XR learning experience",
    description: "AR/VR use case, design, feasibility",
    prompt:
      "Develop a research-informed concept brief for an AR, VR, mixed reality, or simulation-based learning experience about [TOPIC/SKILL]. Focus on learning objectives, learner audience, interaction design, hardware/software requirements, accessibility and motion comfort, assessment strategy, development complexity, relevant examples, and whether the experience should be built as AR, VR, WebXR, Unity, mobile, or a lower-cost alternative.",
  },
  {
    id: "literature-review-education",
    label: "Education literature review",
    description: "Research base for programs and proposals",
    prompt:
      "Conduct an academic literature review on [EDUCATION TOPIC/INTERVENTION]. Prioritize peer-reviewed research, major reports, and recent findings from the last 5 years. Summarize key theories, evidence of effectiveness, target populations, implementation conditions, measurement approaches, gaps in the literature, and implications for UF College of Education projects, grants, or instructional design.",
  },
  {
    id: "grant-landscape-scan",
    label: "Grant landscape scan",
    description: "Funders, priorities, fit, next steps",
    prompt:
      "Research the grant and funding landscape for [PROJECT IDEA/RESEARCH AREA] related to education, learning technology, literacy, AI, workforce development, or digital learning. Identify relevant federal, foundation, state, and university funding opportunities; summarize funder priorities, eligibility, award size, deadlines, required partners, evaluation expectations, and how UF College of Education or ETC could position a competitive proposal.",
  },
  {
    id: "accessibility-udl-review",
    label: "Accessibility & UDL review",
    description: "WCAG, UDL, inclusive learning design",
    prompt:
      "Review [COURSE/WEBSITE/APP/LEARNING MATERIAL/TOOL] through accessibility, Universal Design for Learning, and inclusive design lenses. Identify likely barriers for learners with disabilities, multilingual learners, mobile users, and users with limited bandwidth or technology access. Include WCAG-related considerations, UDL recommendations, media captioning/transcript needs, usability improvements, testing methods, and a prioritized remediation checklist.",
  },
  {
    id: "communications-strategy",
    label: "Communications strategy",
    description: "Audience, messaging, channels, rollout",
    prompt:
      "Create a communications strategy for [PROGRAM/INITIATIVE/RESEARCH PROJECT/EVENT] at UF College of Education. Identify key audiences, stakeholder needs, core messages, tone, recommended channels, content calendar ideas, website/newsletter/social media angles, visual asset needs, success metrics, risks, and a concise launch plan for ETC support.",
  },
  {
    id: "program-evaluation-plan",
    label: "Program evaluation plan",
    description: "Metrics, data, instruments, reporting",
    prompt:
      "Design a practical evaluation plan for [PROGRAM/COURSE/APP/TRAINING/INTERVENTION]. Define the logic model, evaluation questions, success metrics, data sources, collection instruments, timeline, analysis approach, equity/accessibility considerations, reporting format, and recommendations for communicating findings to faculty, administrators, funders, or community partners.",
  },
  {
    id: "implementation-roadmap",
    label: "Implementation roadmap",
    description: "Timeline, roles, risks, deliverables",
    prompt:
      "Create an implementation roadmap for [PROJECT/TOOL/COURSE REDESIGN/TECHNOLOGY INITIATIVE]. Include phases, timeline, key milestones, roles and responsibilities, technical requirements, training needs, stakeholder communication, risk register, dependencies, support model, maintenance plan, and decision points for leadership approval.",
  },
  {
    id: "policy-compliance-scan",
    label: "Policy & compliance scan",
    description: "FERPA, privacy, AI, procurement, accessibility",
    prompt:
      "Research the policy and compliance considerations for [TOOL/PROJECT/WORKFLOW] in a public university education setting. Cover FERPA, student privacy, data security, accessibility, AI governance, copyright, procurement, records retention, research/IRB considerations if relevant, vendor risk, and practical questions ETC should resolve before adoption or launch.",
  },
  {
    id: "peer-institution-scan",
    label: "Peer institution scan",
    description: "Comparable programs and best practices",
    prompt:
      "Find and compare how peer universities or Colleges of Education are approaching [TOPIC/PROGRAM/TECHNOLOGY]. Identify 5 to 10 strong examples, summarize their goals, audiences, technologies, staffing models, funding, public outcomes, strengths, gaps, and lessons UF College of Education or ETC could adapt.",
  },
  {
    id: "learning-analytics-report",
    label: "Learning analytics report",
    description: "Data sources, metrics, dashboards, insights",
    prompt:
      "Research best practices for using learning analytics to evaluate [COURSE/PROGRAM/APP/ONLINE LEARNING EXPERIENCE]. Include relevant metrics, data sources, dashboard examples, student success indicators, privacy and ethics considerations, interpretation pitfalls, recommended visualizations, and a practical reporting format for faculty, staff, and leadership.",
  },
  {
    id: "staff-workflow-automation",
    label: "Staff workflow automation",
    description: "Process, tools, risks, ROI",
    prompt:
      "Analyze how ETC could improve or automate the workflow for [ADMINISTRATIVE/COMMUNICATIONS/E-LEARNING/TECH SUPPORT PROCESS]. Map the current process, identify pain points, compare potential tools or automation approaches, estimate time savings, note risks and compliance issues, and recommend a phased implementation plan with human review points.",
  },
  {
    id: "stakeholder-brief",
    label: "Leadership stakeholder brief",
    description: "Concise decision memo for leaders",
    prompt:
      "Prepare a concise leadership brief on [TOPIC/DECISION/PROJECT IDEA] for UF College of Education stakeholders. Include the issue, why it matters now, evidence summary, options, costs or resource needs, risks, equity/accessibility implications, recommended action, and next steps. Write it in a clear format suitable for a dean, director, PI, or department leadership meeting.",
  },
];
