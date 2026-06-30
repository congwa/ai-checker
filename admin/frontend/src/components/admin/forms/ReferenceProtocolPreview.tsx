/** 业务说明：任务表单参照协议预览组件，展示任务从参照继承的题目和采样次数。 */
import { LockKeyhole } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import type { ReferenceView } from "@/types/domain";
import { FormField } from "@/components/admin/forms/FormField";

interface ReferenceProtocolPreviewProps {
  reference: ReferenceView | null;
}

/** 业务说明：展示所选参照的测试协议，提醒任务只继承题目和采样次数而不单独编辑。 */
export function ReferenceProtocolPreview({ reference }: ReferenceProtocolPreviewProps) {
  return (
    <div className="rounded-md border border-white/[0.12] bg-white/[0.055] p-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-100">
        <LockKeyhole className="h-4 w-4 text-[#b7f860]" />
        测试协议随参照带入
        <span className="rounded border border-[#b7f860]/25 bg-[#b7f860]/10 px-2 py-0.5 text-xs text-[#d8ff8f]">
          不可在任务中修改
        </span>
      </div>
      {reference ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <FormField label="采样次数" htmlFor="task-reference-sample-count">
            <Input
              id="task-reference-sample-count"
              value={`${reference.sample_count} 次`}
              readOnly
              aria-readonly="true"
              className="cursor-not-allowed border-white/[0.12] bg-black/30 text-slate-300"
            />
          </FormField>
          <FormField label="题目" htmlFor="task-reference-prompt">
            <Textarea
              id="task-reference-prompt"
              value={reference.prompt}
              readOnly
              aria-readonly="true"
              className="min-h-20 cursor-not-allowed resize-none border-white/[0.12] bg-black/30 text-slate-300"
            />
          </FormField>
        </div>
      ) : (
        <div className="mt-2 text-slate-400">
          请选择一个已成功标定的参照，任务会自动使用它的题目和采样次数。
        </div>
      )}
    </div>
  );
}
