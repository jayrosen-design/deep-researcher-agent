import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLockup } from "@/components/research/BrandLockup";
import { ThemeToggle } from "@/components/research/ThemeToggle";
import { AGENT_IMAGES } from "@/lib/persona-images";
import apiKeysScreenshot from "@/assets/api-keys-screenshot.png";


export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it Works — Deep Researcher Agent" },
      {
        name: "description",
        content:
          "How the Deep Researcher Agent plans, investigates, and synthesizes cited research reports — plus how to get your NaviGator and Tavily API keys.",
      },
      { property: "og:title", content: "How it Works — Deep Researcher Agent" },
      {
        property: "og:description",
        content:
          "Three-role autonomous agent (Strategist, Searcher, Writer) explained, with API key setup steps.",
      },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-3xl px-6 pb-24 pt-20">
      <BrandLockup className="absolute left-4 top-4" />
      <div className="absolute right-4 top-4 inline-flex items-center gap-2">
        <ThemeToggle />
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
      </div>

      <div className="mt-4 flex justify-center">
        <img
          src={AGENT_IMAGES.workingTogether}
          alt="Strategist, Searcher, and Writer octopus agents working together"
          className="h-64 w-auto object-contain dark:drop-shadow-[0_0_32px_rgba(0,242,254,0.35)]"
        />
      </div>
      <div className="sonar-divider my-6" />

      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        How it Works
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Deep Researcher Agent is an autonomous research assistant that plans,
        searches the web, reads sources, and writes a fully cited Markdown
        report — all in a single run.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">The three roles</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The agent is split into three specialized LLM roles so each call stays
          focused and the outputs stay reliable.
        </p>
        <div className="mt-5 space-y-4">
          <div className="flex gap-4 rounded-xl border border-border bg-card p-5">
            <img
              src={AGENT_IMAGES.strategist}
              alt="Strategist octopus agent"
              className="hidden h-28 w-28 shrink-0 object-contain sm:block dark:drop-shadow-[0_0_22px_rgba(0,242,254,0.3)]"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                1. Strategist
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Reads your question and drafts a structured research plan:
                objective, temporal scope, 3–5 search queries, target domains,
                pitfalls to avoid, and the exact section headers the final report
                must use. You can edit or regenerate the plan before research
                starts.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-xl border border-border bg-card p-5">
            <img
              src={AGENT_IMAGES.searcher}
              alt="Searcher octopus agent"
              className="hidden h-28 w-28 shrink-0 object-contain sm:block dark:drop-shadow-[0_0_22px_rgba(0,242,254,0.3)]"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                2. Searcher
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Runs a strict ReAct loop. On every turn it emits a single JSON
                object choosing one tool: <code>web_search</code> (Tavily),{" "}
                <code>read_url</code> (full-page extract), or <code>finish</code>.
                It must do at least two searches and read at least one page
                before finishing, and it tracks its remaining step budget on each
                turn.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-xl border border-border bg-card p-5">
            <img
              src={AGENT_IMAGES.writer}
              alt="Writer octopus agent"
              className="hidden h-28 w-28 shrink-0 object-contain sm:block dark:drop-shadow-[0_0_22px_rgba(0,242,254,0.3)]"
            />
            <div>
              <div className="text-sm font-semibold text-foreground">
                3. Writer
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                A separate call that receives the plan and all gathered sources,
                then writes the final Markdown report using the plan's exact
                section headers and inline{" "}
                <code>[title](url)</code> citations. A post-processing filter
                strips any citation whose URL was not actually gathered, so
                hallucinated links can't reach the final report.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">
          What you can configure
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Models</strong> — pick a fast
            model for the Searcher's JSON loop and a stronger model for the
            Writer's long-form report.
          </li>
          <li>
            <strong className="text-foreground">Max sources</strong> — caps how
            many unique URLs the agent will collect (10–100).
          </li>
          <li>
            <strong className="text-foreground">System prompts</strong> — view
            and edit the prompts for each role; reset any of them to the
            defaults at any time.
          </li>
          <li>
            <strong className="text-foreground">Templates</strong> — start from
            12 ready-made research prompts and fill in the placeholders.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">API keys</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          API keys are stored only in your browser (localStorage) and sent with
          each request. Leave them blank to use the server's defaults if
          configured.
        </p>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm font-semibold text-foreground">
              UF NaviGator (LLM provider)
            </div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Go to{" "}
                <a
                  href="https://api.ai.it.ufl.edu/ui/?page=api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  api.ai.it.ufl.edu
                </a>{" "}
                and sign in with your UF credentials.
              </li>
              <li>Open the <em>API Keys</em> page from the left nav.</li>
              <li>Create a new key and copy it (starts with <code>sk-</code>).</li>
              <li>
                When NaviGator asks which models to attach to the key, select
                at least one fast model for the Searcher and one strong
                model for the Writer. Suggested picks:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <strong className="text-foreground">Searcher (fast, JSON loop):</strong>{" "}
                    <code>llama-3.1-8b-instruct</code>,{" "}
                    <code>gpt-oss-20b</code>, or{" "}
                    <code>llama-3.1-nemotron-nano-8B-v1</code>.
                  </li>
                  <li>
                    <strong className="text-foreground">Writer (long-form report):</strong>{" "}
                    <code>gpt-oss-120b</code>,{" "}
                    <code>llama-3.3-70b-instruct</code>, or{" "}
                    <code>nemotron-3-super-120b-a12b</code>.
                  </li>
                </ul>
              </li>
              <li>
                Paste the key into <em>API keys → NaviGator API key</em> on
                the home page. The Searcher and Writer dropdowns will
                auto-populate with exactly the models your key has access to.
              </li>

            </ol>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm font-semibold text-foreground">
              Tavily (web search + extract)
            </div>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              <li>
                Sign up at{" "}
                <a
                  href="https://www.tavily.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  tavily.com
                </a>
                . The free tier includes a generous monthly request quota.
              </li>
              <li>From the dashboard, copy your API key (starts with <code>tvly-</code>).</li>
              <li>
                Paste it into <em>API keys → Tavily API key</em> on the home
                page.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="text-base font-semibold text-foreground">About</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This app was created by <strong className="text-foreground">Jay Rosen</strong> at the{" "}
          <strong className="text-foreground">University of Florida</strong> for
          educational and research purposes. Questions or feedback?{" "}
          <a
            href="mailto:jayrosen@ufl.edu"
            className="text-foreground underline-offset-2 hover:underline"
          >
            jayrosen@ufl.edu
          </a>
          .
        </p>
      </section>
    </div>
  );
}
