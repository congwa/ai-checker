/** 业务说明：后台工作台布局壳，统一桌面侧栏、移动导航和内容容器的操作路径。 */
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { ADMIN_NAV_ITEMS, type AdminSection } from "@/lib/config/navigation";

interface AdminShellProps {
  activeSection: AdminSection;
  selectedTaskName: string | null;
  onSectionChange: (section: AdminSection) => void;
  children: ReactNode;
}

/** 业务说明：渲染后台全局框架，让各管理页面共享一致导航、宽度和移动端信息架构。 */
export function AdminShell({
  activeSection,
  selectedTaskName,
  onSectionChange,
  children,
}: AdminShellProps) {
  return (
    <main className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-slate-800 bg-slate-950 px-4 py-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-teal-400/30 bg-teal-400/10 text-teal-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-teal-200">AI Checker</div>
              <div className="text-xs text-slate-500">Admin Console</div>
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-6 lg:grid-cols-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSection === item.id || (activeSection === "edit" && item.id === "tasks");
              return (
                <button
                  key={item.id}
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-300 lg:h-10 ${
                    isActive
                      ? "bg-teal-300 text-slate-950"
                      : "text-slate-300 hover:bg-slate-900 hover:text-slate-50"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSectionChange(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 hidden rounded-md border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-400 lg:block">
            当前任务：{selectedTaskName ?? "未选择"}
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[1520px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
