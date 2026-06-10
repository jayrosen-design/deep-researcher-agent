import { STAGE_IMAGES } from "@/lib/persona-images";

type StageKey = keyof typeof STAGE_IMAGES;

export function StageHeader({ stage, title }: { stage: StageKey; title: string }) {
  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <img
        src={STAGE_IMAGES[stage]}
        alt={`${title} octopus agent`}
        className="h-48 w-auto object-contain dark:drop-shadow-[0_0_22px_rgba(0,242,254,0.35)]"
      />
      <div className="text-base font-medium text-foreground text-center">{title}</div>
    </div>
  );
}
