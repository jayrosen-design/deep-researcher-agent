export type ResearchTemplate = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export const RESEARCH_TEMPLATES: ResearchTemplate[] = [
  {
    id: "evidence-map",
    label: "Evidence map",
    description: "Research base, strength of evidence, gaps",
    prompt:
      "Create an evidence map for [EDUCATION TOPIC / INTERVENTION / TECHNOLOGY] for use by UF College of Education staff and faculty. Focus the research on peer-reviewed studies, major research syntheses, federal or foundation reports, and credible professional organizations. Identify what is well-supported, what is promising but uncertain, what populations or contexts have been studied, what outcomes were measured, where evidence is weak or conflicting, and what practical implications ETC should consider before recommending or building around this approach.",
  },
  {
    id: "edtech-adoption-brief",
    label: "EdTech adoption brief",
    description: "Adoption decision, risks, fit, implementation",
    prompt:
      "Prepare a deep research adoption brief on [EDTECH TOOL / PLATFORM / CATEGORY] for UF College of Education and ETC decision-making. Investigate current product capabilities, higher education use cases, Canvas or LMS integrations, accessibility support, privacy and data practices, FERPA-relevant concerns, vendor stability, cost model if publicly available, faculty and student support needs, comparable tools, and evidence of instructional value. The final report should help ETC decide whether to pilot, recommend, avoid, or monitor this technology.",
  },
  {
    id: "ai-workflow-evaluation",
    label: "AI workflow evaluation",
    description: "AI use case, governance, quality, labor impact",
    prompt:
      "Research the feasibility, risks, and best practices for using [AI TOOL / AI WORKFLOW / AGENTIC SYSTEM] in an ETC or College of Education workflow. Focus on evidence from universities, education technology teams, AI governance guidance, professional associations, and vendor documentation when necessary. Evaluate likely benefits, quality-control requirements, privacy and data risks, accessibility issues, bias concerns, staff workload implications, training needs, and an implementation model that keeps humans accountable for final decisions.",
  },
  {
    id: "xr-learning-feasibility",
    label: "XR learning feasibility",
    description: "AR/VR/MR use case, evidence, build decision",
    prompt:
      "Research whether an AR, VR, MR, WebXR, or simulation-based learning experience is appropriate for [LEARNING TOPIC / SKILL / COURSE / TRAINING NEED]. Prioritize evidence on learning outcomes, embodiment, presence, simulation training, accessibility, motion comfort, hardware constraints, development cost, maintenance burden, classroom logistics, and comparable university projects. The report should help ETC determine whether the experience should be built in Unity, WebXR, mobile AR, 360 video, interactive web media, or a lower-cost non-XR format.",
  },
  {
    id: "peer-benchmarking",
    label: "Peer institution scan",
    description: "Comparable university programs and practices",
    prompt:
      "Conduct a peer institution scan on how Colleges of Education or university e-learning teams are approaching [PROGRAM / SERVICE / TECHNOLOGY / INITIATIVE]. Identify strong examples from peer universities, aspirational universities, and relevant public higher education institutions. Compare goals, staffing models, technologies, funding, public-facing outputs, support structures, accessibility practices, and measurable outcomes when available. The report should identify models UF College of Education or ETC could realistically adapt.",
  },
  {
    id: "grant-opportunity-scan",
    label: "Grant opportunity scan",
    description: "Funders, programs, deadlines, positioning",
    prompt:
      "Research current and recurring grant opportunities for [PROJECT AREA / RESEARCH IDEA / EDUCATION TECHNOLOGY INITIATIVE]. Focus on federal agencies, foundations, Florida or regional funders, university programs, and education-focused funding sources. Identify funder priorities, eligibility, award ranges, deadline cycles, required partners, evaluation expectations, technology or dissemination requirements, and how UF College of Education could position a competitive proposal. Flag opportunities that are currently open separately from recurring or likely future opportunities.",
  },
  {
    id: "course-redesign-research",
    label: "Course redesign research",
    description: "Evidence-based redesign options",
    prompt:
      "Research evidence-based redesign options for [COURSE / TRAINING / MODULE / ONLINE PROGRAM]. Focus on instructional strategies, digital learning design, active learning, assessment models, multimedia learning, accessibility, student engagement, and comparable higher education examples. The final report should translate the research into practical redesign options for ETC, including what to change, why it is supported, what tools or media may be needed, and how success could be measured.",
  },
  {
    id: "accessibility-udl-research",
    label: "Accessibility and UDL research",
    description: "Inclusive design standards and best practices",
    prompt:
      "Research accessibility, Universal Design for Learning, and inclusive digital learning best practices for [COURSE / WEBSITE / APP / MEDIA PROJECT / LEARNING TOOL]. Prioritize WCAG guidance, higher education accessibility resources, UDL research, disability services guidance, and examples from universities. Identify likely barriers, legal or policy considerations, design recommendations, testing methods, remediation priorities, and practical guidance ETC can use when supporting faculty or building digital learning materials.",
  },
  {
    id: "evaluation-framework",
    label: "Evaluation framework",
    description: "Metrics, instruments, outcomes, reporting",
    prompt:
      "Research how to evaluate the effectiveness of [PROGRAM / APP / COURSE / TRAINING / TECHNOLOGY INITIATIVE] in a College of Education context. Identify evaluation models, outcome measures, validated instruments if available, learning analytics approaches, qualitative and quantitative data sources, equity considerations, privacy constraints, reporting formats, and examples from similar education initiatives. The final report should recommend a practical evaluation framework ETC could support or implement.",
  },
  {
    id: "policy-compliance-diligence",
    label: "Policy and compliance diligence",
    description: "Privacy, FERPA, AI, copyright, accessibility",
    prompt:
      "Conduct policy and compliance due diligence for [TOOL / PLATFORM / WORKFLOW / DIGITAL LEARNING PROJECT] in a public university education setting. Research FERPA and student privacy concerns, accessibility obligations, AI governance issues if relevant, copyright and licensing, data retention, vendor risk, procurement concerns, research or IRB considerations when applicable, and examples of how universities manage similar risks. The final report should separate confirmed requirements from practical risk-management recommendations.",
  },
  {
    id: "communications-landscape",
    label: "Communications landscape",
    description: "Audience, channels, examples, message strategy",
    prompt:
      "Research the communications landscape for [PROGRAM / INITIATIVE / EVENT / SERVICE / RESEARCH PROJECT] at a College of Education or university unit. Identify target audiences, comparable communication campaigns, successful messaging approaches, web and newsletter examples, social media strategies, visual communication patterns, accessibility considerations, stakeholder concerns, and metrics used to evaluate reach or engagement. The final report should help ETC create a stronger launch or awareness strategy.",
  },
  {
    id: "implementation-roadmap-research",
    label: "Implementation roadmap research",
    description: "Phased rollout, staffing, support, risks",
    prompt:
      "Research implementation models and best practices for launching [TECHNOLOGY / SERVICE / COURSE MODEL / DIGITAL LEARNING INITIATIVE] in a university or College of Education context. Investigate staffing needs, training models, governance, technical dependencies, stakeholder engagement, rollout phases, support models, maintenance requirements, risks, and comparable examples. The final report should provide a phased roadmap that ETC leadership could use for planning, resourcing, and decision-making.",
  },
];
