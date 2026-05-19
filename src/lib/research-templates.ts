export type ResearchTemplate = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export const RESEARCH_TEMPLATES: ResearchTemplate[] = [
  {
    id: "market-analysis",
    label: "Market analysis",
    description: "Size, growth, segments, key players",
    prompt:
      "Conduct a comprehensive market analysis of [INDUSTRY/PRODUCT]. Cover market size and growth rate (last 3 years + 5-year forecast), key segments, leading companies and their market share, recent M&A activity, regulatory landscape, and major trends or disruptors shaping the market.",
  },
  {
    id: "competitor-deep-dive",
    label: "Competitor deep dive",
    description: "Products, pricing, positioning, strategy",
    prompt:
      "Provide a deep competitive analysis of [COMPANY]. Include: product/service lineup, pricing models, target customers, go-to-market strategy, recent funding or financials, leadership team, strengths and weaknesses vs competitors, recent news (last 12 months), and strategic direction.",
  },
  {
    id: "academic-literature",
    label: "Academic literature review",
    description: "Peer-reviewed findings on a topic",
    prompt:
      "Conduct an academic-style literature review on [TOPIC]. Focus on peer-reviewed sources, summarize key theories and findings, identify points of consensus and ongoing debate, highlight seminal papers and recent (last 3 years) advances, and note open research questions.",
  },
  {
    id: "technical-deep-dive",
    label: "Technical deep dive",
    description: "Architecture, tradeoffs, implementations",
    prompt:
      "Do a technical deep dive on [TECHNOLOGY/SYSTEM]. Explain how it works under the hood, its architecture, key design tradeoffs, real-world implementations and benchmarks, common pitfalls, comparisons to alternatives, and current state of the ecosystem.",
  },
  {
    id: "news-recap",
    label: "Recent news recap",
    description: "What happened recently and why it matters",
    prompt:
      "Summarize the most important recent news (last 30 days) about [TOPIC/COMPANY/PERSON]. For each major story include what happened, when, who's involved, and why it matters. Cite primary news sources and flag any conflicting reports.",
  },
  {
    id: "product-comparison",
    label: "Product comparison",
    description: "Side-by-side evaluation of options",
    prompt:
      "Compare [PRODUCT A], [PRODUCT B], and [PRODUCT C] for [USE CASE]. Include feature matrix, pricing, performance, integrations, user reviews and ratings, pros and cons of each, and a clear recommendation for different user profiles.",
  },
  {
    id: "investment-research",
    label: "Investment research",
    description: "Financials, thesis, risks, valuation",
    prompt:
      "Produce investment research on [COMPANY/TICKER]. Cover business model, recent financial performance (revenue, margins, growth), competitive moat, bull case, bear case, key risks, recent analyst views, insider activity, and a fair-value perspective with supporting data.",
  },
  {
    id: "person-profile",
    label: "Person / executive profile",
    description: "Background, work, public statements",
    prompt:
      "Create an in-depth profile of [PERSON]. Include background and education, career history, current role, notable accomplishments, public statements and interviews, philanthropic or political activity, and recent news mentions. Cite reputable sources only.",
  },
  {
    id: "policy-regulation",
    label: "Policy & regulation",
    description: "Laws, agencies, compliance impact",
    prompt:
      "Research the current regulatory landscape for [INDUSTRY/TOPIC] in [JURISDICTION]. Cover key laws and agencies, recent rulings or proposed legislation, compliance requirements, enforcement trends, and likely impact on businesses and consumers.",
  },
  {
    id: "how-to-guide",
    label: "How-to guide",
    description: "Practical step-by-step from best sources",
    prompt:
      "Build a practical how-to guide for [TASK/GOAL]. Synthesize the best advice from experts, tutorials, and documentation into a clear step-by-step approach. Include prerequisites, common mistakes to avoid, recommended tools, and links to the highest-quality reference material.",
  },
  {
    id: "trend-forecast",
    label: "Trend & future outlook",
    description: "Where things are heading and why",
    prompt:
      "Analyze emerging trends and the 3–5 year outlook for [TOPIC/INDUSTRY]. Identify the most credible predictions from analysts and experts, the data and signals behind them, contrarian views, and the implications for stakeholders.",
  },
  {
    id: "historical-background",
    label: "Historical background",
    description: "Origins, key events, lasting impact",
    prompt:
      "Provide a well-sourced historical background on [TOPIC/EVENT]. Cover origins, timeline of key events, principal figures and their roles, primary causes and consequences, differing historical interpretations, and the lasting impact.",
  },
];
