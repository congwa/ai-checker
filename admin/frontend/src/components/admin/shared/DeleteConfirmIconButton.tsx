/** 业务说明：后台删除确认按钮组件，统一任务和参照等危险操作的确认、等待和说明体验。 */
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { StatusIcon } from "@/components/ui/status";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DeleteConfirmIconButtonProps {
  ariaLabel: string;
  tooltip: string;
  title: string;
  description: string;
  confirmLabel: string;
  disabled: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
}

/** 业务说明：渲染危险删除确认，要求用户明确确认后才执行会影响后台配置的删除动作。 */
export function DeleteConfirmIconButton({
  ariaLabel,
  tooltip,
  title,
  description,
  confirmLabel,
  disabled,
  isDeleting,
  onConfirm,
}: DeleteConfirmIconButtonProps) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="danger" disabled={disabled} aria-label={ariaLabel}>
              {isDeleting ? <StatusIcon status="running" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
