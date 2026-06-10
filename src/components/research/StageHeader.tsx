import { STAGE_IMAGES } from "@/lib/persona-images";

type StageKey = keyof typeof STAGE_IMAGES;

export function StageHeader({ stage, title }: { stage: StageKey; title: string }) {
  return (
    <div className="mb-6 flex items-center justify-center gap-4">
      <img
        src={STAGE_IMAGES[stage]}
        alt={`${title} octopus agent`}
        className="h-20 w-20 shrink-0 object-contain dark:drop-shadow-[0_0_22px_rgba(0,242,254,0.35)]"
      />
      <div className="text-sm font-medium text-foreground">{title}</div>
    </div>
  );
}
