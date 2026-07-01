/** 业务说明：后台工作台布局壳，统一桌面侧栏、移动导航和内容容器的操作路径。 */
import type { ReactNode } from "react";
import { Activity, DatabaseZap, ShieldCheck } from "lucide-react";
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
      <div className="grid min-h-screen lg:grid-cols-[268px_minmax(0,1fr)]">
        <aside className="border-b border-white/[0.11] bg-[linear-gradient(180deg,rgba(7,10,10,0.98),rgba(3,5,6,0.96))] px-4 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.045),0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.11] bg-white/[0.05] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <img
              className="h-11 w-11 rounded-md bg-black/35 object-contain p-1 shadow-[0_0_0_1px_rgba(183,248,96,.26)]"
              src="/codexbuy-logo.png"
              alt=""
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-semibold text-[#f4f7ef]">codexbuy 渠道监测</div>
              <div className="mt-0.5 text-xs font-medium text-slate-500">AI Checker Ops</div>
            </div>
            <ShieldCheck className="ml-auto h-4 w-4 text-[#b7f860]" aria-hidden="true" />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-1">
            <div className="rounded-lg border border-white/[0.09] bg-black/20 px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                <Activity className="h-3.5 w-3.5 text-[#39e6c1]" />
                Signal
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-100">Live</div>
            </div>
            <div className="rounded-lg border border-white/[0.09] bg-black/20 px-3 py-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                <DatabaseZap className="h-3.5 w-3.5 text-[#ffb84d]" />
                Store
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-100">Redis</div>
            </div>
            <div className="rounded-lg border border-white/[0.09] bg-black/20 px-3 py-2 lg:hidden">
              <div className="text-[11px] font-semibold text-slate-500">Task</div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-100">{selectedTaskName ?? "未选择"}</div>
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-5 lg:grid-cols-1" aria-label="后台导航">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSection === item.id || (activeSection === "edit" && item.id === "tasks");
              return (
                <button
                  key={item.id}
                  className={`group flex h-11 items-center gap-3 rounded-md border px-3 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#b7f860]/75 motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:h-10 ${
                    isActive
                      ? "border-[#e4ff8a]/[0.45] bg-[#b7f860] text-[#07100d] shadow-[0_12px_28px_rgba(183,248,96,0.15)]"
                      : "border-transparent text-slate-300 hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-slate-50"
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

          <div className="mt-5 hidden rounded-lg border border-[#ffb84d]/20 bg-[#ffb84d]/[0.07] p-3 text-xs text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] lg:block">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#ffe0a6]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffb84d] shadow-[0_0_16px_rgba(255,184,77,0.55)]" />
              当前任务
            </div>
            <div className="truncate text-slate-200">{selectedTaskName ?? "未选择"}</div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 md:px-6 lg:px-7 lg:py-6">
          <div className="mx-auto max-w-[1580px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
