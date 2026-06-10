import businessOps from "@/assets/personas/business-ops.png";
import designer from "@/assets/personas/designer.png";
import developer from "@/assets/personas/developer.png";
import eduLeader from "@/assets/personas/edu-leader.png";
import higherEd from "@/assets/personas/higher-ed-instructor.png";
import instructional from "@/assets/personas/instructional-designer.png";
import marketing from "@/assets/personas/marketing.png";
import researcher from "@/assets/personas/researcher-agent.png";
import teacher from "@/assets/personas/teacher.png";

import strategist from "@/assets/personas/strategist-agent.png";
import searcher from "@/assets/personas/searcher-agent.png";
import writer from "@/assets/personas/writer-agent.png";
import workingTogether from "@/assets/personas/working-togeather.png";

import type { UserRoleId } from "@/lib/research-templates";

export const PERSONA_IMAGES: Record<UserRoleId, string> = {
  "researcher": researcher,
  "school-teacher": teacher,
  "higher-education-instructor": higherEd,
  "instructional-designer": instructional,
  "education-leader": eduLeader,
  "experience-designer": designer,
  "software-developer": developer,
  "communications-marketing": marketing,
  "business-operations": businessOps,
};

export const AGENT_IMAGES = {
  strategist,
  searcher,
  writer,
  workingTogether,
};

export const STAGE_IMAGES = {
  plan: strategist,
  searching: searcher,
  report: writer,
  final: workingTogether,
};
