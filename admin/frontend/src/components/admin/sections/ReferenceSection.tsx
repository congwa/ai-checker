/** 业务说明：参照管理页面区块，承载参照指标、参照列表和新增参照表单入口。 */
import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, X } from "lucide-react";
import { AdminPanel } from "@/components/admin/layout/AdminPanel";
import { MetricCard } from "@/components/admin/MetricCard";
import { ReferenceForm } from "@/components/admin/ReferenceForm";
import { ReferenceList } from "@/components/admin/ReferenceList";
import { Button } from "@/components/ui/button";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";

interface ReferenceSectionProps {
  dashboard: AdminDashboardState;
}

/** 业务说明：渲染参照管理页，用户先配置并运行参照，再创建监控任务。 */
export function ReferenceSection({ dashboard }: ReferenceSectionProps) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className={isCreating ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]" : "space-y-5"}>
      <div className="space-y-5">
        <section className="grid grid-cols-3 gap-3 sm:gap-4">
          <MetricCard compact title="参照数" value={String(dashboard.references.length)} tone="text-slate-100" />
          <MetricCard
            compact
            title="已标定"
            value={String(dashboard.references.filter((reference) => reference.latest_success_run_id).length)}
            tone="text-teal-200"
          />
          <MetricCard
            compact
            title="需处理"
            value={String(dashboard.references.filter((reference) => !reference.latest_success_run_id).length)}
            tone="text-amber-200"
          />
        </section>

        <AdminPanel
          title="参照列表"
          description="只有成功标定的参照才能作为任务基准；失败时请检查模型、密钥或 Prompt 后重试。"
          action={
            <Button variant={isCreating ? "secondary" : "primary"} onClick={() => setIsCreating((value) => !value)}>
              {isCreating ? <X className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              {isCreating ? "收起表单" : "新增参照"}
            </Button>
          }
        >
          <ReferenceList
            references={dashboard.references}
            runJobByTarget={dashboard.runJobByTarget}
            deletingIds={dashboard.deletingIds}
            onRun={dashboard.runReferenceNow}
            onDelete={dashboard.removeReference}
          />
        </AdminPanel>
      </div>

      {isCreating ? (
        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="xl:sticky xl:top-5 xl:self-start"
        >
          <ReferenceForm compact onSubmit={dashboard.saveReference} />
        </motion.aside>
      ) : null}
    </div>
  );
}
