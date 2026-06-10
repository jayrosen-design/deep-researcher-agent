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
import type { MoeExpertId } from "./moe-prompts";

export const PERSONA_ICONS: Record<MoeExpertId, LucideIcon> = {
  researcher: Microscope,
  "school-teacher": GraduationCap,
  "higher-education-instructor": BookOpen,
  "instructional-designer": PencilRuler,
  "education-leader": Building2,
  "experience-designer": Palette,
  "software-developer": Code2,
  "communications-marketing": Megaphone,
  "business-operations": Briefcase,
};
