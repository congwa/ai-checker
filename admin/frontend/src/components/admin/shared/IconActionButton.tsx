/** 业务说明：后台图标操作按钮组件，为列表里的查看、编辑等紧凑动作提供统一可解释入口。 */
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IconActionButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

/** 业务说明：渲染带 Tooltip 的图标按钮，避免后台列表中仅靠图标造成误点或理解成本。 */
export function IconActionButton({ label, onClick, children }: IconActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="secondary" aria-label={label} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
