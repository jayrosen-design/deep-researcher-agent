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
  Video,
  Briefcase,
  Users,
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
  | "video-media-producer"
  | "business-operations"
  | "human-resources";

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
    ],
  },
  {
    id: "communications-marketing",
    label: "Communications and Marketing",
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
    ],
  },
  {
    id: "video-media-producer",
    label: "Video and Media Producer",
    description: "Educational media, production models, formats, accessibility",
    icon: Video,
    templates: [
      {
        id: "educational-video-format-review",
        roleId: "video-media-producer",
        label: "Educational video format review",
        description: "Video types and learning impact",
        prompt:
          "Research effective video and media formats for teaching [TOPIC / SKILL / CONCEPT]. Compare lecture video, demonstration, interview, animation, screen recording, scenario-based video, short-form clips, and interactive media where relevant. Evaluate evidence on learning impact, attention, accessibility, production effort, reuse value, and recommended format choices.",
      },
      {
        id: "media-production-workflow",
        roleId: "video-media-producer",
        label: "Media production workflow",
        description: "Planning, tools, roles, timeline, delivery",
        prompt:
          "Research production workflows for [VIDEO / PODCAST / MULTIMEDIA / ONLINE COURSE MEDIA PROJECT]. Identify planning steps, scripting practices, recording approaches, editing workflows, accessibility requirements, captioning and transcript practices, file delivery standards, quality-control methods, staffing needs, and examples from education or training media teams.",
      },
      {
        id: "interactive-media-scan",
        roleId: "video-media-producer",
        label: "Interactive media scan",
        description: "Interactive video, branching, simulations",
        prompt:
          "Research interactive media approaches for [LEARNING TOPIC / TRAINING SCENARIO / AUDIENCE]. Compare branching video, interactive timelines, simulations, quizzes inside media, immersive media, and web-based interactives. Evaluate learning benefits, production complexity, accessibility, hosting requirements, analytics, and examples of strong implementations.",
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
  {
    id: "human-resources",
    label: "Human Resources",
    description: "Training, roles, hiring, workplace policy, professional growth",
    icon: Users,
    templates: [
      {
        id: "workforce-training-research",
        roleId: "human-resources",
        label: "Workforce training research",
        description: "Training needs, formats, outcomes",
        prompt:
          "Research best practices for workforce training on [SKILL / POLICY / TOOL / WORKPLACE NEED]. Compare training formats, adult learning principles, competency models, assessment approaches, accessibility, learner motivation, time requirements, reinforcement strategies, and evaluation methods. The final report should recommend a practical training model.",
      },
      {
        id: "role-competency-benchmark",
        roleId: "human-resources",
        label: "Role and competency benchmark",
        description: "Job roles, skills, career paths",
        prompt:
          "Benchmark roles, responsibilities, and competency expectations for [JOB FAMILY / POSITION / TEAM FUNCTION]. Research job descriptions, professional frameworks, salary or labor-market information when available, required skills, emerging competencies, career progression, training needs, and examples from similar organizations. The final report should support role design, hiring, promotion, or professional development planning.",
      },
      {
        id: "workplace-policy-scan",
        roleId: "human-resources",
        label: "Workplace policy scan",
        description: "Policy examples and implementation concerns",
        prompt:
          "Research workplace policy examples and implementation considerations for [POLICY AREA / WORKPLACE PRACTICE / STAFF PROCESS]. Focus on credible guidance, comparable organizations, legal or compliance considerations at a general level, equity and accessibility, communication needs, training needs, risks, and evaluation methods. The final report should identify policy options and practical rollout considerations.",
      },
      {
        id: "professional-development-pathway-scan",
        roleId: "human-resources",
        label: "Professional development pathway scan",
        description: "Certificates, workshops, coaching, mentoring",
        prompt:
          "Research professional development pathways for staff who need to build skills in [SKILL AREA / ROLE / TECHNOLOGY]. Compare certificates, workshops, communities of practice, mentoring, project-based learning, coaching, assessment methods, time requirements, and evidence of workforce impact.",
      },
      {
        id: "change-management-research-brief",
        roleId: "human-resources",
        label: "Change management research brief",
        description: "Adoption, communication, training, sentiment",
        prompt:
          "Research change management strategies for implementing [POLICY / TECHNOLOGY / WORKFLOW / ORGANIZATIONAL CHANGE]. Identify stakeholder concerns, communication strategies, training needs, leadership practices, adoption barriers, equity considerations, and methods for measuring adoption and sentiment.",
      },
      {
        id: "hiring-market-role-design-scan",
        roleId: "human-resources",
        label: "Hiring market and role design scan",
        description: "Titles, skills, salary, career ladders",
        prompt:
          "Research the hiring market and role design considerations for [POSITION / JOB FAMILY / TEAM NEED]. Compare job titles, responsibilities, required skills, emerging competencies, salary ranges when available, remote or hybrid norms, career ladders, and onboarding needs. Recommend how to structure the role for long-term success.",
      },
    ],
  },
];

export const RESEARCH_TEMPLATES: ResearchTemplate[] = RESEARCH_ROLE_GROUPS.flatMap(
  (role) => role.templates,
);
