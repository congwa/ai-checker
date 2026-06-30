/** 业务说明：管理端任务表单组件，支持创建任务和编辑模型采样配置。 */
import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { FormField } from "@/components/admin/forms/FormField";
import { ReferenceProtocolPreview } from "@/components/admin/forms/ReferenceProtocolPreview";
import { SwitchField } from "@/components/admin/forms/SwitchField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { StatusIcon } from "@/components/ui/status";
import type { ReferenceView, TaskPayload, TaskView } from "@/types/domain";

interface TaskFormProps {
  task: TaskView | null;
  references: ReferenceView[];
  onSubmit: (payload: TaskPayload, taskId?: string) => Promise<void>;
}

const emptyForm: TaskPayload = {
  name: "",
  provider: "openai",
  base_url: "https://api.openai.com/v1",
  api_key: "",
  model: "",
  reference_id: "",
  interval_seconds: 3600,
  smoothing_level: 65,
  enabled: true,
  public_enabled: false,
  public_score_range_enabled: false,
  public_score_min: 85,
  public_score_max: 100,
};

/** 业务说明：渲染任务配置表单，编辑时 API Key 留空表示沿用后端已加密密钥。 */
export function TaskForm({ task, references, onSubmit }: TaskFormProps) {
  const [form, setForm] = useState<TaskPayload>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const selectedReference =
    references.find((reference) => reference.id === form.reference_id) ?? null;

  useEffect(() => {
    if (!task) {
      setForm(emptyForm);
      return;
    }
    setForm({
      name: task.name,
      provider: task.provider,
      base_url: task.base_url,
      api_key: "",
      model: task.model,
      reference_id: task.reference_id ?? "",
      interval_seconds: task.interval_seconds,
      smoothing_level: task.smoothing_level,
      enabled: task.enabled,
      public_enabled: task.public_enabled,
      public_score_range_enabled: task.public_score_range_enabled,
      public_score_min: task.public_score_min,
      public_score_max: task.public_score_max,
    });
  }, [task]);

  /** 业务说明：提交任务配置，按创建或更新场景调用上层工作台业务动作。 */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.reference_id) {
      setFormError("请选择一个已成功标定的参照，任务会自动继承它的题目和采样次数。");
      return;
    }
    if (form.public_score_range_enabled && form.public_score_max - form.public_score_min < 5) {
      setFormError("前台显示分区间至少需要相差 5 分。");
      return;
    }
    if (
      form.public_score_min < 0 ||
      form.public_score_max > 100 ||
      form.public_score_min >= form.public_score_max
    ) {
      setFormError("前台显示分区间必须在 0-100 之间，且最低分小于最高分。");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      await onSubmit(form, task?.id);
      if (!task) setForm(emptyForm);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardTitle>{task ? "编辑任务" : "新建任务"}</CardTitle>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="任务名称" htmlFor="task-name">
            <Input id="task-name" value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Provider" htmlFor="task-provider">
            <Select
              value={form.provider}
              onValueChange={(value) => setForm({ ...form, provider: value as TaskPayload["provider"] })}
            >
              <SelectTrigger id="task-provider">
                <SelectValue placeholder="选择 Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Base URL" htmlFor="task-base-url">
            <Input id="task-base-url" value={form.base_url} required onChange={(event) => setForm({ ...form, base_url: event.target.value })} />
          </Field>
          <Field label={task ? "API Key（留空沿用）" : "API Key"} htmlFor="task-api-key">
            <Input id="task-api-key" type="password" value={form.api_key ?? ""} required={!task} onChange={(event) => setForm({ ...form, api_key: event.target.value })} />
          </Field>
          <Field label="模型名称" htmlFor="task-model">
            <Input id="task-model" value={form.model} required onChange={(event) => setForm({ ...form, model: event.target.value })} />
          </Field>
          <Field label="选择参照" htmlFor="task-reference">
            <Select
              value={form.reference_id}
              onValueChange={(value) => {
                setForm({ ...form, reference_id: value });
                setFormError(null);
              }}
            >
              <SelectTrigger id="task-reference" aria-invalid={Boolean(formError)}>
                <SelectValue placeholder="请选择已成功标定的参照" />
              </SelectTrigger>
              <SelectContent>
                {references.map((reference) => (
                  <SelectItem key={reference.id} value={reference.id} disabled={!reference.latest_success_run_id}>
                    {reference.name} / {reference.model}
                    {reference.latest_success_run_id ? "" : "（未成功标定）"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="间隔秒数" htmlFor="task-interval-seconds">
            <Input id="task-interval-seconds" type="number" min={60} value={form.interval_seconds} onChange={(event) => setForm({ ...form, interval_seconds: Number(event.target.value) })} />
          </Field>
          <Field label={`平滑度 ${form.smoothing_level}`} htmlFor="task-smoothing-level">
            <Slider
              id="task-smoothing-level"
              min={0}
              max={100}
              step={1}
              value={[form.smoothing_level]}
              onValueChange={([value]) => setForm({ ...form, smoothing_level: value })}
            />
          </Field>
        </div>
        <ReferenceProtocolPreview reference={selectedReference} />
        {formError ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <SwitchField
            id="task-enabled"
            label="启用调度"
            checked={form.enabled}
            onCheckedChange={(checked) => setForm({ ...form, enabled: checked })}
          />
          <SwitchField
            id="task-public-enabled"
            label="公开展示"
            checked={form.public_enabled}
            onCheckedChange={(checked) => setForm({ ...form, public_enabled: checked })}
          />
          <SwitchField
            id="task-public-score-range-enabled"
            label="前台分区间"
            checked={form.public_score_range_enabled}
            onCheckedChange={(checked) =>
              setForm({ ...form, public_score_range_enabled: checked })
            }
          />
        </div>
        {form.public_score_range_enabled ? (
          <div className="grid gap-3 rounded-md border border-white/[0.12] bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:grid-cols-2">
            <Field label="最低显示分" htmlFor="task-public-score-min">
              <Input
                id="task-public-score-min"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form.public_score_min}
                onChange={(event) =>
                  setForm({ ...form, public_score_min: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="最高显示分" htmlFor="task-public-score-max">
              <Input
                id="task-public-score-max"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={form.public_score_max}
                onChange={(event) =>
                  setForm({ ...form, public_score_max: Number(event.target.value) })
                }
              />
            </Field>
          </div>
        ) : null}
        <Button className="w-full" type="submit" disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? <StatusIcon status="running" /> : <Save className="h-4 w-4" />}
          {isSaving ? "保存中" : "保存任务"}
        </Button>
      </form>
    </Card>
  );
}

/** 业务说明：包装表单字段标签和控件，保持任务配置录入的扫描节奏一致。 */
const Field = FormField;
