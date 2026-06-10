import { useState } from "react";
import { ArrowUp, LayoutTemplate } from "lucide-react";

import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { SOURCE_COUNT_OPTIONS, type UserSettings } from "@/lib/user-settings";
import { RESEARCH_ROLE_GROUPS, type UserRoleId } from "@/lib/research-templates";
import { PERSONA_IMAGES } from "@/lib/persona-images";

export function PromptInput({
  onSubmit,
  settings,
  onSettingsChange,
  roleId,
  onRoleChange,
}: {
  onSubmit: (prompt: string) => void;
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
  roleId?: UserRoleId;
  onRoleChange?: (id: UserRoleId) => void;
}) {
  const [value, setValue] = useState("");
  const [internalRoleId, setInternalRoleId] = useState<UserRoleId>("researcher");
  const activeRoleId = roleId ?? internalRoleId;
  const setActiveRoleId = (id: UserRoleId) => {
    setInternalRoleId(id);
    onRoleChange?.(id);
  };
  const [showTemplates, setShowTemplates] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const activeRole =
    RESEARCH_ROLE_GROUPS.find((r) => r.id === activeRoleId) ?? RESEARCH_ROLE_GROUPS[0];
  const personaImage = PERSONA_IMAGES[activeRoleId];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pt-8 pb-12">
      <div className="flex w-full flex-col items-center">
        <img
          key={activeRoleId}
          src={personaImage}
          alt={`${activeRole.label} octopus persona`}
          className="pointer-events-none h-[300px] w-auto object-contain transition-opacity duration-500 dark:drop-shadow-[0_0_32px_rgba(0,242,254,0.4)]"
        />
        <div className="flex w-full flex-col items-center justify-center">
          <div className="mt-4 mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            Deep Researcher Agent · {activeRole.label}
          </div>
          <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What should we research?
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Multi-agents work together to plan, search the web, and synthesize a cited report.
          </p>


          <form onSubmit={handleSubmit} className="mt-10 w-full">
            <div className="relative rounded-2xl border border-border bg-card shadow-sm transition focus-within:border-foreground/30 focus-within:shadow-md">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
                }}
                placeholder="e.g. Compare the latest fusion energy breakthroughs of 2025 and their commercial timelines."
                rows={4}
                className="w-full resize-none rounded-2xl bg-transparent px-5 py-4 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
              />
              <div className="flex flex-col gap-2 border-t border-border px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1">Max sources</span>
                      <select
                        value={settings.maxSources}
                        onChange={(e) =>
                          onSettingsChange({ ...settings, maxSources: Number(e.target.value) })
                        }
                        className="rounded-md border border-border bg-white px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 dark:bg-background"
                      >
                        {SOURCE_COUNT_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTemplates((s) => !s)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground hover:text-background"
                    >
                      <LayoutTemplate className="size-3.5" />
                      Templates
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!value.trim()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Start research
                    <ArrowUp className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </form>

          <Collapsible open={showTemplates} onOpenChange={setShowTemplates} className="w-full">
            <CollapsibleContent className="collapsible-content">
              <div className="mt-6 w-full">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                  {RESEARCH_ROLE_GROUPS.map((role) => {
                    const RoleIcon = role.icon;
                    const isActive = role.id === activeRoleId;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setActiveRoleId(role.id)}
                        className={
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition " +
                          (isActive
                            ? "border-foreground/40 bg-foreground text-background"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:bg-foreground hover:text-background")
                        }
                      >
                        <RoleIcon className="size-3.5" />
                        {role.label}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-foreground">{activeRole.label} templates</div>
                    <div className="text-xs text-muted-foreground">
                      {activeRole.description}. Click one to load it, then replace [PLACEHOLDERS] with your specifics.
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {activeRole.templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setValue(template.prompt)}
                        className="group flex flex-col items-start gap-1 rounded-lg border border-border bg-background p-3 text-left transition hover:border-foreground/40 hover:bg-foreground hover:text-background"
                      >
                        <div className="text-sm font-medium text-foreground group-hover:text-background">{template.label}</div>
                        <div className="text-xs text-muted-foreground group-hover:text-background/80">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
