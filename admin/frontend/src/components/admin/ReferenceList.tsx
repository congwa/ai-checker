/** 业务说明：参照列表组件，展示参照配置、最新标定状态并提供运行/删除操作。 */
import { Crosshair, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import type { ReferenceView } from "@/types/domain";

interface ReferenceListProps {
  references: ReferenceView[];
  busyId: string | null;
  onRun: (referenceId: string) => void;
  onDelete: (referenceId: string) => void;
}

/** 业务说明：渲染参照配置表，帮助用户先标定基准再创建监控任务。 */
export function ReferenceList({ references, busyId, onRun, onDelete }: ReferenceListProps) {
  if (references.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-700 p-8 text-sm text-slate-400">
        暂无参照，请先新增一个参照配置。
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <div className="hidden grid-cols-[minmax(220px,1fr)_160px_150px_180px] gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 text-xs font-semibold uppercase text-slate-500 lg:grid">
        <span>参照</span>
        <span>标定状态</span>
        <span>标定次数</span>
        <span className="text-right">操作</span>
      </div>
      {references.map((reference) => (
        <article
          key={reference.id}
          className="grid gap-3 border-b border-slate-800 bg-slate-950/60 px-4 py-4 last:border-b-0 lg:grid-cols-[minmax(220px,1fr)_160px_150px_180px] lg:items-center"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
              <Crosshair className="h-4 w-4 text-teal-300" />
              {reference.name}
            </div>
            <div className="mt-1 truncate text-xs text-slate-400">{reference.model}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={reference.latest_run_id ? "success" : "warning"}>
              {reference.latest_run_id ? "已标定" : "待运行"}
            </Badge>
          </div>
          <div className="text-xs text-slate-400">
            {reference.sample_count} 次 / {formatDateTime(reference.updated_at)}
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button className="h-8 px-3" disabled={busyId === reference.id} onClick={() => onRun(reference.id)}>
              <Play className="h-4 w-4" />
              运行参照
            </Button>
            <Button className="h-8 px-3" variant="danger" onClick={() => onDelete(reference.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

