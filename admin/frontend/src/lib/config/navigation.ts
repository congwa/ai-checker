/** 业务说明：后台导航配置，定义管理台主流程入口和对应中文标签。 */
import { Crosshair, History, ListChecks, PlusCircle } from "lucide-react";

export type AdminSection = "references" | "tasks" | "add" | "history" | "edit";

export const ADMIN_NAV_ITEMS: Array<{
  id: Exclude<AdminSection, "edit">;
  label: string;
  icon: typeof ListChecks;
}> = [
  { id: "references", label: "参照管理", icon: Crosshair },
  { id: "tasks", label: "任务列表", icon: ListChecks },
  { id: "add", label: "添加任务", icon: PlusCircle },
  { id: "history", label: "任务历史", icon: History },
];

/** 业务说明：根据当前后台入口返回顶部小标题，帮助用户确认所在模块。 */
export function getAdminSectionEyebrow(section: AdminSection) {
  if (section === "references") return "Reference Center";
  if (section === "add") return "Task Create";
  if (section === "history") return "Run History";
  if (section === "edit") return "Task Settings";
  return "Task Center";
}

/** 业务说明：根据当前后台入口返回主标题，让任务列表、添加和历史模块层级明确。 */
export function getAdminSectionTitle(section: AdminSection) {
  if (section === "references") return "参照管理";
  if (section === "add") return "添加任务";
  if (section === "history") return "任务历史";
  if (section === "edit") return "编辑任务";
  return "任务列表";
}
