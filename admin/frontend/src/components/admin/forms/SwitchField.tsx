/** 业务说明：后台开关字段组件，统一任务调度、公开展示等二元业务设置的展示方式。 */
import { Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface SwitchFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** 业务说明：渲染任务二元开关，让调度和公开状态在创建或编辑时都能被明确控制。 */
export function SwitchField({ id, label, checked, onCheckedChange }: SwitchFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-900/50 p-3">
      <Label htmlFor={id}>{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
