/** 业务说明：后台工作台布局壳，统一桌面侧栏、移动导航和内容容器的操作路径。 */
import type { ReactNode } from "react";
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
    <main className="min-h-screen text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-[#071018]/90 px-4 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] backdrop-blur lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <img
              className="h-11 w-11 rounded-md object-contain shadow-[0_0_0_1px_rgba(45,212,191,.28)]"
              src="/codexbuy-logo.png"
              alt=""
              aria-hidden="true"
            />
            <div>
              <div className="text-sm font-semibold text-teal-100">codexbuy 渠道监测</div>
              <div className="text-xs font-medium text-slate-500">AI Checker Ops</div>
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
                  className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition-[background-color,border-color,color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-teal-200/80 lg:h-10 ${
                    isActive
                      ? "bg-teal-300 text-slate-950 shadow-[0_10px_28px_rgba(20,184,166,0.22)]"
                      : "border border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-slate-50"
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

          <div className="mt-6 hidden rounded-lg border border-amber-200/15 bg-amber-200/[0.06] p-3 text-xs text-slate-400 lg:block">
            <div className="mb-2 flex items-center gap-2 font-semibold text-amber-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
              当前任务
            </div>
            <div className="truncate text-slate-200">{selectedTaskName ?? "未选择"}</div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 md:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-[1520px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
