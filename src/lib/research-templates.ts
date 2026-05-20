import type { LucideIcon } from "lucide-react";
import {
  Microscope,
  GraduationCap,
  BookOpen,
  PencilRuler,
  Building2,
  Palette,
  Code2,
  Megaphone,
  Briefcase,
} from "lucide-react";

export type UserRoleId =
  | "researcher"
  | "school-teacher"
  | "higher-education-instructor"
  | "instructional-designer"
  | "education-leader"
  | "experience-designer"
  | "software-developer"
  | "communications-marketing"
  | "business-operations";

export type ResearchTemplate = {
  id: string;
  roleId: UserRoleId;
  label: string;
  description: string;
  prompt: string;
};

export type ResearchRoleGroup = {
  id: UserRoleId;
  label: string;
  description: string;
  icon: LucideIcon;
  templates: ResearchTemplate[];
};

export const RESEARCH_ROLE_GROUPS: ResearchRoleGroup[] = [
  {
    id: "researcher",
    label: "Researcher",
    description: "Literature, evidence, methods, gaps, and research trends",
    icon: Microscope,
    templates: [
      {
        id: "evidence-map",
        roleId: "researcher",
        label: "Evidence map",
        description: "What is known, uncertain, or missing",
        prompt:
          "Create a deep research evidence map on [TOPIC / INTERVENTION / TECHNOLOGY]. Prioritize peer-reviewed studies, systematic reviews, meta-analyses, government reports, foundation reports, and major professional organizations. Identify the strongest findings, areas of consensus, disputed claims, populations studied, outcomes measured, methodological limits, research gaps, and practical implications for future projects or decision-making.",
      },
      {
        id: "literature-review",
        roleId: "researcher",
        label: "Literature review",
        description: "Peer-reviewed research synthesis",
        prompt:
          "Conduct a focused literature review on [RESEARCH TOPIC]. Emphasize peer-reviewed sources and high-quality research syntheses. Compare major theories, study designs, findings, limitations, and recent developments from the last 5 years. Identify seminal work, emerging directions, unresolved questions, and implications for research, practice, or future funding proposals.",
      },
      {
        id: "methods-measurement-scan",
        roleId: "researcher",
        label: "Methods and measurement scan",
        description: "Instruments, outcomes, datasets, study designs",
        prompt:
          "Research methods and measurement approaches used to study [TOPIC / PROGRAM / INTERVENTION]. Identify common research designs, validated instruments, outcome measures, data sources, sampling strategies, analysis methods, ethical concerns, and known validity or reliability issues. Recommend which approaches appear most appropriate for a new study or evaluation.",
      },
      {
        id: "research-replication-scan",
        roleId: "researcher",
        label: "Research replication scan",
        description: "Replication, contradictions, stability",
        prompt:
          "Research whether [STUDY / INTERVENTION / FINDING] has been replicated or challenged. Prioritize peer-reviewed studies, systematic reviews, meta-analyses, and credible research syntheses. Identify original claims, replication attempts, contradictory findings, methodological differences, populations studied, effect sizes when available, and whether the evidence appears stable enough to inform practice or future research.",
      },
      {
        id: "emerging-research-frontier-scan",
        roleId: "researcher",
        label: "Emerging research frontier scan",
        description: "New questions, leaders, directions",
        prompt:
          "Map the emerging research frontier around [TOPIC / METHOD / TECHNOLOGY]. Focus on recent peer-reviewed work, preprints when clearly labeled, major conferences, funded projects, and research center outputs. Identify new questions, technical or methodological shifts, leading researchers or institutions, promising directions, unresolved debates, and implications for future studies.",
      },
      {
        id: "research-to-practice-translation-brief",
        roleId: "researcher",
        label: "Research-to-practice translation brief",
        description: "From findings to practical implementation",
        prompt:
          "Investigate how findings from [RESEARCH AREA] can be translated into practical use. Compare what the research supports, what practitioners need to implement it, where translation often fails, what resources or training are required, and what outcomes should be monitored. The report should distinguish evidence-based recommendations from reasonable but less-proven applications.",
      },
    ],
  },
  {
    id: "school-teacher",
    label: "School Teacher",
    description: "Classroom practice, curriculum, interventions, student support",
    icon: GraduationCap,
    templates: [
      {
        id: "classroom-intervention-scan",
        roleId: "school-teacher",
        label: "Classroom intervention scan",
        description: "Evidence-based classroom strategies",
        prompt:
          "Research evidence-based classroom strategies for [SUBJECT / GRADE BAND / STUDENT NEED]. Focus on studies, professional guidance, classroom implementation examples, student outcomes, required materials, teacher workload, equity considerations, and common challenges. The final report should distinguish between strongly supported practices, promising practices, and practices with limited evidence.",
      },
      {
        id: "curriculum-resource-review",
        roleId: "school-teacher",
        label: "Curriculum resource review",
        description: "Compare teaching resources and materials",
        prompt:
          "Compare available curriculum resources, lesson collections, activities, and instructional materials for [TOPIC / GRADE BAND / SUBJECT]. Evaluate alignment with learning goals, evidence base, accessibility, differentiation options, cultural relevance, ease of classroom use, cost if available, and teacher preparation requirements. Include specific examples and a recommendation for different classroom contexts.",
      },
      {
        id: "student-support-research",
        roleId: "school-teacher",
        label: "Student support research",
        description: "Support strategies for specific learners",
        prompt:
          "Research support strategies for [STUDENT GROUP / LEARNING CHALLENGE / CLASSROOM NEED]. Prioritize credible education research, practitioner guidance, and examples from school settings. Identify what works, what conditions are needed, common mistakes, equity concerns, family communication considerations, and practical next steps a teacher could take.",
      },
      {
        id: "lesson-strategy-evidence-scan",
        roleId: "school-teacher",
        label: "Lesson strategy evidence scan",
        description: "Instructional moves and conditions for impact",
        prompt:
          "Research effective teaching strategies for helping students learn [CONCEPT / SKILL / STANDARD]. Prioritize classroom studies, practitioner guidance from credible education organizations, curriculum examples, and evidence syntheses. Identify instructional moves, example activities, differentiation options, common misconceptions, assessment ideas, and conditions that make the strategy more or less effective.",
      },
      {
        id: "classroom-technology-use-case-review",
        roleId: "school-teacher",
        label: "Classroom technology use case review",
        description: "Tool fit, workload, privacy, examples",
        prompt:
          "Research whether [DIGITAL TOOL / TECHNOLOGY CATEGORY] is useful for teaching [SUBJECT / GRADE BAND / SKILL]. Compare evidence of learning impact, classroom management needs, student accessibility, teacher workload, device or connectivity requirements, privacy concerns, and examples of successful classroom implementation.",
      },
      {
        id: "family-engagement-research-brief",
        roleId: "school-teacher",
        label: "Family engagement research brief",
        description: "Messages, channels, culturally responsive practices",
        prompt:
          "Research evidence-based ways to communicate with families about [STUDENT NEED / CLASSROOM INITIATIVE / LEARNING GOAL]. Identify what messages are most effective, what barriers families may face, culturally responsive communication practices, recommended channels, timing, examples from schools, and ways to measure whether communication improved participation or student support.",
      },
    ],
  },
  {
    id: "higher-education-instructor",
    label: "Higher Education Instructor",
    description: "Course design, teaching practice, assessment, student engagement",
    icon: BookOpen,
    templates: [
      {
        id: "course-redesign-scan",
        roleId: "higher-education-instructor",
        label: "Course redesign scan",
        description: "Evidence-based redesign options",
        prompt:
          "Research evidence-based redesign options for [COURSE / MODULE / ASSIGNMENT]. Focus on learning outcomes, active learning, assessment design, online or blended teaching, student engagement, accessibility, workload, and examples from higher education. The final report should identify realistic redesign options, the evidence behind them, trade-offs, and ways to measure whether the redesign works.",
      },
      {
        id: "assessment-practice-review",
        roleId: "higher-education-instructor",
        label: "Assessment practice review",
        description: "Rubrics, exams, projects, feedback",
        prompt:
          "Research assessment approaches for [COURSE / SKILL / SUBJECT AREA]. Compare exams, projects, portfolios, discussions, rubrics, peer review, automated feedback, and authentic assessment where relevant. Identify evidence on learning impact, grading reliability, academic integrity, accessibility, student workload, instructor workload, and recommended implementation practices.",
      },
      {
        id: "teaching-with-generative-tools",
        roleId: "higher-education-instructor",
        label: "Teaching with generative tools",
        description: "Instructional uses, policy, risks",
        prompt:
          "Research how generative artificial intelligence tools are being used in higher education teaching for [COURSE / DISCIPLINE / LEARNING GOAL]. Focus on instructional value, assignment design, student learning, academic integrity, bias, accessibility, privacy, policy examples, faculty workload, and assessment redesign. The final report should separate responsible uses from high-risk or poorly supported uses.",
      },
      {
        id: "student-engagement-strategy-scan",
        roleId: "higher-education-instructor",
        label: "Student engagement strategy scan",
        description: "Active learning, discussion, feedback",
        prompt:
          "Research evidence-based ways to increase student engagement in [COURSE TYPE / DISCIPLINE / MODALITY]. Compare active learning, discussion, collaborative work, reflective assignments, formative feedback, attendance or participation structures, and digital tools. Evaluate evidence of impact, implementation difficulty, equity considerations, and student workload.",
      },
      {
        id: "academic-integrity-landscape-review",
        roleId: "higher-education-instructor",
        label: "Academic integrity landscape review",
        description: "Policy, assessment redesign, detection limits",
        prompt:
          "Research academic integrity challenges and responses related to [ASSIGNMENT TYPE / COURSE / TECHNOLOGY]. Focus on current higher education guidance, policy examples, assessment redesign, student motivation, detection limits, privacy concerns, and approaches that reduce misconduct while preserving meaningful learning.",
      },
      {
        id: "discipline-teaching-benchmark",
        roleId: "higher-education-instructor",
        label: "Discipline-specific teaching benchmark",
        description: "Pedagogical models and signature assignments",
        prompt:
          "Research how instructors teach [SUBJECT / DISCIPLINE / SKILL] across higher education. Identify common pedagogical models, signature assignments, assessment methods, lab or studio practices if relevant, common student difficulties, examples from universities, and emerging changes in the field.",
      },
    ],
  },
  {
    id: "instructional-designer",
    label: "Instructional Designer",
    description: "Learning design, accessibility, evaluation, media, online learning",
    icon: PencilRuler,
    templates: [
      {
        id: "learning-design-patterns",
        roleId: "instructional-designer",
        label: "Learning design patterns",
        description: "Instructional strategies and design models",
        prompt:
          "Research learning design patterns for [LEARNING GOAL / TRAINING TOPIC / COURSE TYPE]. Compare instructional models, sequencing strategies, practice activities, feedback approaches, assessment methods, multimedia principles, accessibility considerations, and evidence of effectiveness. The final report should translate the research into design recommendations and example learning activities.",
      },
      {
        id: "accessibility-inclusive-design",
        roleId: "instructional-designer",
        label: "Accessibility and inclusive design",
        description: "Barriers, standards, remediation, testing",
        prompt:
          "Research accessibility and inclusive design best practices for [COURSE / WEBSITE / APP / DIGITAL MATERIAL / MEDIA PROJECT]. Prioritize web accessibility guidance, inclusive pedagogy research, universal design for learning, disability support resources, and examples from education settings. Identify likely barriers, testing methods, remediation priorities, design recommendations, and implementation trade-offs.",
      },
      {
        id: "online-learning-quality-review",
        roleId: "instructional-designer",
        label: "Online learning quality review",
        description: "Quality standards and course improvement",
        prompt:
          "Research quality standards and best practices for improving [ONLINE COURSE / TRAINING PROGRAM / DIGITAL LEARNING EXPERIENCE]. Focus on course structure, learner navigation, instructor presence, interaction, assessment, multimedia, accessibility, student support, analytics, and evaluation. The final report should identify practical improvement priorities and examples of strong implementation.",
      },
      {
        id: "modality-comparison",
        roleId: "instructional-designer",
        label: "Learning experience modality comparison",
        description: "In-person, online, blended, simulation fit",
        prompt:
          "Research which modality is best suited for [LEARNING EXPERIENCE / TRAINING GOAL]: in-person, online asynchronous, online synchronous, blended, simulation, mobile, or self-paced. Compare evidence, learner needs, interaction requirements, accessibility, cost, development time, instructor workload, and assessment fit.",
      },
      {
        id: "microlearning-research-brief",
        roleId: "instructional-designer",
        label: "Microlearning research brief",
        description: "Retention, transfer, spacing, fit",
        prompt:
          "Research whether microlearning is appropriate for [TRAINING TOPIC / SKILL / AUDIENCE]. Examine evidence on retention, transfer, motivation, spacing, assessment, mobile access, workplace learning, limitations, and examples of effective design. Recommend when microlearning should be used alone, combined with other instruction, or avoided.",
      },
      {
        id: "scenario-based-learning-scan",
        roleId: "instructional-designer",
        label: "Scenario-based learning design scan",
        description: "Branching, feedback, assessment, examples",
        prompt:
          "Research scenario-based learning approaches for [SKILL / DECISION-MAKING CONTEXT / PROFESSIONAL PRACTICE]. Identify evidence of effectiveness, design patterns, branching complexity, feedback strategies, assessment methods, accessibility concerns, examples, and practical recommendations for building or revising a scenario-based experience.",
      },
    ],
  },
  {
    id: "education-leader",
    label: "Education Leader",
    description: "Strategy, policy, adoption, evaluation, organizational planning",
    icon: Building2,
    templates: [
      {
        id: "strategic-landscape-scan",
        roleId: "education-leader",
        label: "Strategic landscape scan",
        description: "Trends, risks, opportunities, decisions",
        prompt:
          "Conduct a strategic landscape scan on [TOPIC / INITIATIVE / TECHNOLOGY / PROGRAM AREA]. Identify current trends, drivers of change, major stakeholders, peer examples, risks, opportunities, costs or resource implications when available, policy considerations, and likely 3-year outlook. The final report should support leadership decision-making and include practical options.",
      },
      {
        id: "program-evaluation-framework",
        roleId: "education-leader",
        label: "Program evaluation framework",
        description: "Logic model, metrics, reporting",
        prompt:
          "Research evaluation frameworks for [PROGRAM / INITIATIVE / SERVICE / LEARNING EXPERIENCE]. Identify possible logic models, evaluation questions, outcome measures, data sources, reporting formats, equity considerations, privacy constraints, and examples from similar programs. Recommend a practical evaluation approach that could be used for leadership, funders, or continuous improvement.",
      },
      {
        id: "policy-risk-review",
        roleId: "education-leader",
        label: "Policy and risk review",
        description: "Governance, compliance, adoption risks",
        prompt:
          "Research policy, governance, and risk considerations for [TOOL / PROGRAM / INITIATIVE / WORKFLOW]. Focus on student privacy, data security, accessibility, procurement, copyright, artificial intelligence governance if relevant, implementation risks, stakeholder concerns, and examples of how similar organizations manage these issues. Separate confirmed requirements from recommended risk-management practices.",
      },
      {
        id: "innovation-readiness-scan",
        roleId: "education-leader",
        label: "Innovation readiness scan",
        description: "Infrastructure, buy-in, go/no-go decision",
        prompt:
          "Research organizational readiness factors for adopting [PROGRAM / TECHNOLOGY / INITIATIVE]. Identify required infrastructure, staffing, training, stakeholder buy-in, governance, budget pressures, equity concerns, adoption risks, and examples of successful and unsuccessful implementations. The report should support a go, no-go, or phased pilot decision.",
      },
      {
        id: "strategic-partnership-landscape",
        roleId: "education-leader",
        label: "Strategic partnership landscape",
        description: "Models, governance, funding, sustainability",
        prompt:
          "Research potential partnership models for [PROGRAM AREA / SERVICE / INITIATIVE]. Compare partnerships with schools, universities, nonprofits, industry, government agencies, and community organizations. Identify benefits, risks, governance models, funding structures, evaluation expectations, sustainability issues, and examples worth adapting.",
      },
      {
        id: "long-term-sustainability-review",
        roleId: "education-leader",
        label: "Long-term sustainability review",
        description: "Funding, staffing, lifecycle, ownership",
        prompt:
          "Research sustainability models for [PROGRAM / TECHNOLOGY / SERVICE]. Investigate funding, staffing, maintenance, training, governance, stakeholder ownership, evaluation, and lifecycle planning. Identify why similar efforts persist, scale, stagnate, or fail, and recommend practical sustainability strategies.",
      },
    ],
  },
  {
    id: "experience-designer",
    label: "Experience Designer",
    description: "User research, service design, usability, interaction patterns",
    icon: Palette,
    templates: [
      {
        id: "user-needs-research",
        roleId: "experience-designer",
        label: "User needs research",
        description: "Audience needs, pain points, behaviors",
        prompt:
          "Research user needs, pain points, and behavior patterns for [AUDIENCE / PRODUCT / SERVICE / LEARNING EXPERIENCE]. Use credible reports, case studies, usability research, education technology research, and comparable products or services. Identify user goals, barriers, motivations, accessibility needs, trust concerns, and design implications.",
      },
      {
        id: "design-pattern-benchmark",
        roleId: "experience-designer",
        label: "Design pattern benchmark",
        description: "Comparable products and interaction models",
        prompt:
          "Benchmark design patterns used in [PRODUCT CATEGORY / WEBSITE TYPE / LEARNING EXPERIENCE / DIGITAL SERVICE]. Compare navigation, onboarding, search, dashboards, feedback, personalization, accessibility, visual hierarchy, and interaction models. The final report should identify strong examples, weak patterns to avoid, and recommendations for a new design.",
      },
      {
        id: "service-design-scan",
        roleId: "experience-designer",
        label: "Service design scan",
        description: "Journey, touchpoints, support model",
        prompt:
          "Research service design approaches for [SERVICE / PROGRAM / SUPPORT WORKFLOW]. Identify user journeys, stakeholder touchpoints, common failure points, support expectations, communication needs, accessibility issues, operational constraints, and examples from similar services. Recommend improvements to the end-to-end experience.",
      },
      {
        id: "usability-research-benchmark",
        roleId: "experience-designer",
        label: "Usability research benchmark",
        description: "Friction points, testing, trust signals",
        prompt:
          "Research usability best practices for [PRODUCT / WEBSITE / APPLICATION / DIGITAL SERVICE]. Compare navigation, onboarding, search, forms, dashboards, feedback, mobile use, accessibility, and trust signals. Identify examples, common friction points, testing methods, and design recommendations grounded in research or comparable implementations.",
      },
      {
        id: "learner-journey-research",
        roleId: "experience-designer",
        label: "Learner journey research",
        description: "Goals, barriers, drop-off, support needs",
        prompt:
          "Research the learner journey for [AUDIENCE / COURSE / PROGRAM / DIGITAL EXPERIENCE]. Identify user goals, emotions, barriers, decision points, support needs, accessibility needs, communication touchpoints, and drop-off risks. Recommend design changes that improve clarity, confidence, and completion.",
      },
      {
        id: "information-architecture-scan",
        roleId: "experience-designer",
        label: "Information architecture scan",
        description: "Navigation, taxonomy, search, metadata",
        prompt:
          "Research information architecture patterns for [WEBSITE / PORTAL / RESOURCE LIBRARY / KNOWLEDGE BASE]. Compare navigation models, taxonomy, search behavior, metadata, filtering, content grouping, accessibility, and examples from comparable organizations. Recommend a structure that helps users find high-value content quickly.",
      },
    ],
  },
  {
    id: "software-developer",
    label: "Software Developer",
    description: "Architecture, tools, implementation, security, build decisions",
    icon: Code2,
    templates: [
      {
        id: "technical-architecture-comparison",
        roleId: "software-developer",
        label: "Technical architecture comparison",
        description: "Stack options, trade-offs, implementation",
        prompt:
          "Research technical architecture options for building [APP / TOOL / PLATFORM / FEATURE]. Compare relevant frameworks, hosting models, databases, application programming interfaces, authentication options, security considerations, scalability, cost, developer experience, maintenance burden, and examples from similar systems. The final report should recommend a practical architecture with trade-offs.",
      },
      {
        id: "build-vs-buy-feasibility",
        roleId: "software-developer",
        label: "Build versus buy feasibility",
        description: "Custom development versus existing tools",
        prompt:
          "Research whether [PRODUCT / FEATURE / WORKFLOW] should be built internally, purchased, integrated, or avoided. Compare existing tools, open-source options, custom development complexity, integration needs, security and privacy risks, accessibility, long-term maintenance, vendor dependency, and total cost considerations when available. The final report should provide a clear recommendation.",
      },
      {
        id: "developer-tooling-scan",
        roleId: "software-developer",
        label: "Developer tooling scan",
        description: "Frameworks, libraries, services, workflows",
        prompt:
          "Research the current tooling landscape for [DEVELOPMENT TASK / FRAMEWORK / TECHNICAL WORKFLOW]. Prioritize official documentation, active repositories, release notes, technical benchmarks, security advisories, and credible engineering analysis. Identify mature options, emerging options, common pitfalls, compatibility constraints, and recommended next steps for prototyping.",
      },
      {
        id: "security-privacy-architecture-scan",
        roleId: "software-developer",
        label: "Security and privacy architecture scan",
        description: "Auth, storage, encryption, threat models",
        prompt:
          "Research security and privacy considerations for building [APPLICATION / PLATFORM / FEATURE]. Focus on authentication, authorization, data storage, logging, encryption, third-party services, threat models, secure development practices, accessibility, compliance considerations, and examples of common failures to avoid.",
      },
      {
        id: "api-integration-review",
        roleId: "software-developer",
        label: "API integration review",
        description: "Auth, rate limits, reliability, risks",
        prompt:
          "Research integration options for connecting [SYSTEM A] with [SYSTEM B] or building around [SERVICE / APPLICATION PROGRAMMING INTERFACE]. Compare official documentation, authentication methods, rate limits, data formats, developer support, reliability, pricing when available, security concerns, and maintenance risks.",
      },
      {
        id: "open-source-dependency-review",
        roleId: "software-developer",
        label: "Open-source dependency review",
        description: "Maintenance, license, security, adoption",
        prompt:
          "Research open-source libraries or frameworks for [TECHNICAL TASK / FEATURE / WORKFLOW]. Prioritize official repositories, documentation, release history, issue activity, community adoption, license terms, security advisories, performance benchmarks, and long-term maintenance signals. Recommend mature options and identify risky dependencies.",
      },
    ],
  },
  {
    id: "communications-marketing",
    label: "Communications & Marketing",
    description: "Audience research, campaigns, messaging, channels, analytics",
    icon: Megaphone,
    templates: [
      {
        id: "audience-message-research",
        roleId: "communications-marketing",
        label: "Audience and message research",
        description: "Messaging strategy and audience needs",
        prompt:
          "Research audience needs, message positioning, and communication strategies for [PROGRAM / SERVICE / EVENT / INITIATIVE]. Identify target audiences, motivations, barriers, trusted channels, comparable campaigns, message examples, accessibility considerations, visual communication patterns, and metrics used to evaluate reach or engagement.",
      },
      {
        id: "campaign-benchmark-scan",
        roleId: "communications-marketing",
        label: "Campaign benchmark scan",
        description: "Comparable campaigns and launch tactics",
        prompt:
          "Benchmark communication campaigns related to [TOPIC / PROGRAM / EVENT / SERVICE]. Compare goals, audiences, channels, tone, visuals, content formats, calls to action, posting cadence, media coverage, and available impact metrics. The final report should identify best practices and practical ideas for a new campaign.",
      },
      {
        id: "content-strategy-research",
        roleId: "communications-marketing",
        label: "Content strategy research",
        description: "Website, newsletter, social, storytelling",
        prompt:
          "Research content strategy options for [ORGANIZATION / PROGRAM / TOPIC / AUDIENCE]. Focus on website structure, newsletter themes, social media formats, storytelling angles, search visibility, accessibility, editorial workflow, content governance, and examples from similar organizations. Recommend a content plan grounded in evidence and comparable examples.",
      },
      {
        id: "brand-positioning-research",
        roleId: "communications-marketing",
        label: "Brand positioning research",
        description: "Positioning, tone, differentiation",
        prompt:
          "Research how [ORGANIZATION / PROGRAM / SERVICE / PRODUCT] should be positioned for [AUDIENCE]. Analyze comparable organizations, audience needs, messaging patterns, value propositions, tone, visual identity cues, search visibility, trust signals, and differentiation opportunities. Recommend positioning themes supported by evidence and examples.",
      },
      {
        id: "public-awareness-campaign-scan",
        roleId: "communications-marketing",
        label: "Public awareness campaign scan",
        description: "Framing, channels, partnerships, outcomes",
        prompt:
          "Research public awareness campaigns related to [TOPIC / CAUSE / PROGRAM]. Compare audience targeting, message framing, channels, visuals, partnerships, calls to action, accessibility, evaluation metrics, and outcomes when available. Identify campaign strategies that could be adapted for a new initiative.",
      },
      {
        id: "search-discoverability-review",
        roleId: "communications-marketing",
        label: "Search and content discoverability review",
        description: "Search terms, gaps, metadata, structure",
        prompt:
          "Research how audiences search for information about [TOPIC / SERVICE / PROGRAM]. Identify common search terms, content gaps, competitor or peer content, frequently asked questions, effective page structures, metadata practices, accessibility considerations, and opportunities to improve discoverability.",
      },
    ],
  },
  {
    id: "business-operations",
    label: "Business and Operations",
    description: "Costs, vendors, processes, market landscape, efficiency",
    icon: Briefcase,
    templates: [
      {
        id: "vendor-comparison",
        roleId: "business-operations",
        label: "Vendor comparison",
        description: "Options, cost, fit, risk",
        prompt:
          "Compare vendors or product options for [NEED / TOOL CATEGORY / SERVICE]. Research features, pricing when available, implementation requirements, support model, accessibility, privacy and security posture, contract or procurement considerations, customer examples, risks, and alternatives. The final report should recommend the strongest options for different budget or complexity levels.",
      },
      {
        id: "process-improvement-research",
        roleId: "business-operations",
        label: "Process improvement research",
        description: "Workflow efficiency and automation",
        prompt:
          "Research process improvement options for [WORKFLOW / SERVICE / ADMINISTRATIVE PROCESS]. Identify common bottlenecks, automation possibilities, staffing implications, software tools, quality-control practices, risk points, change-management needs, and examples from comparable organizations. Estimate potential benefits qualitatively when hard data is unavailable.",
      },
      {
        id: "market-landscape-scan",
        roleId: "business-operations",
        label: "Market landscape scan",
        description: "Industry, products, trends, competitors",
        prompt:
          "Conduct a market landscape scan for [PRODUCT CATEGORY / SERVICE AREA / INDUSTRY]. Research major providers, customer segments, pricing patterns when available, recent product trends, adoption drivers, risks, market shifts, and credible forecasts. The final report should support planning, purchasing, partnership, or product strategy decisions.",
      },
      {
        id: "cost-benefit-research-brief",
        roleId: "business-operations",
        label: "Cost-benefit research brief",
        description: "Direct, hidden costs and likely benefits",
        prompt:
          "Research the cost-benefit case for [TOOL / SERVICE / PROCESS CHANGE / INITIATIVE]. Identify direct costs, hidden costs, staff time, training needs, implementation risks, maintenance burden, likely benefits, comparable examples, and metrics that should be tracked to determine return on investment.",
      },
      {
        id: "procurement-landscape-scan",
        roleId: "business-operations",
        label: "Procurement landscape scan",
        description: "Vendors, pricing, contracts, decision criteria",
        prompt:
          "Research purchasing options for [PRODUCT / SERVICE / PLATFORM CATEGORY]. Compare vendors, pricing models when public, contract considerations, implementation requirements, support quality, accessibility, privacy and security posture, customer examples, and risks. Recommend a shortlist and decision criteria.",
      },
      {
        id: "operational-risk-review",
        roleId: "business-operations",
        label: "Operational risk review",
        description: "Failure points, dependencies, mitigation",
        prompt:
          "Research operational risks associated with [WORKFLOW / SERVICE / TECHNOLOGY / INITIATIVE]. Identify failure points, staffing dependencies, vendor risks, compliance concerns, data risks, user support needs, continuity planning, and mitigation strategies used by comparable organizations.",
      },
    ],
  },
];

export const RESEARCH_TEMPLATES: ResearchTemplate[] = RESEARCH_ROLE_GROUPS.flatMap(
  (role) => role.templates,
);
