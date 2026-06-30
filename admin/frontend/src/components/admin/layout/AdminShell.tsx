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
        <aside className="border-b border-white/[0.12] bg-[linear-gradient(180deg,rgba(9,12,13,0.96),rgba(5,6,7,0.94))] px-4 py-4 shadow-[inset_-1px_0_0_rgba(255,255,255,0.045),0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 rounded-lg border border-white/[0.12] bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]">
            <img
              className="h-11 w-11 rounded-md bg-black/30 object-contain p-1 shadow-[0_0_0_1px_rgba(183,248,96,.28)]"
              src="/codexbuy-logo.png"
              alt=""
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="truncate font-display text-sm font-semibold text-[#f4f7ef]">codexbuy 渠道监测</div>
              <div className="mt-0.5 text-xs font-medium text-slate-500">AI Checker Ops</div>
            </div>
            <span className="ml-auto rounded-md border border-[#b7f860]/25 bg-[#b7f860]/10 px-2 py-1 text-[10px] font-bold text-[#d8ff8f]">
              OPS
            </span>
          </div>

          <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-6 lg:grid-cols-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeSection === item.id || (activeSection === "edit" && item.id === "tasks");
              return (
                <button
                  key={item.id}
                  className={`flex h-11 items-center gap-3 rounded-md border px-3 text-sm font-semibold transition-[transform,background-color,border-color,color,box-shadow] duration-200 hover:-translate-y-px focus:outline-none focus:ring-2 focus:ring-[#b7f860]/80 lg:h-10 ${
                    isActive
                      ? "border-[#e4ff8a]/[0.45] bg-[#b7f860] text-[#07100d] shadow-[0_12px_32px_rgba(183,248,96,0.16)]"
                      : "border-transparent text-slate-300 hover:border-white/[0.12] hover:bg-white/[0.065] hover:text-slate-50"
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

          <div className="mt-6 hidden rounded-lg border border-[#ffb84d]/20 bg-[#ffb84d]/[0.07] p-3 text-xs text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] lg:block">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#ffe0a6]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ffb84d] shadow-[0_0_16px_rgba(255,184,77,0.55)]" />
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
