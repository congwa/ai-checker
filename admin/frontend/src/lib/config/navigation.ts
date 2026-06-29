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
