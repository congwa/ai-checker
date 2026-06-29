/** 业务说明：管理端任务表单组件，支持创建任务和编辑模型采样配置。 */
import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { ReferenceView, TaskPayload, TaskView } from "@/types/domain";

const DEFAULT_PROMPT = "请从1到355之间随机选择一个数字，只输出这个数字，不要有任何其他内容。";

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
  prompt: DEFAULT_PROMPT,
  sample_count: 50,
  interval_seconds: 3600,
  smoothing_level: 65,
  enabled: true,
  public_enabled: true,
};

/** 业务说明：渲染任务配置表单，编辑时 API Key 留空表示沿用后端已加密密钥。 */
export function TaskForm({ task, references, onSubmit }: TaskFormProps) {
  const [form, setForm] = useState<TaskPayload>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

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
      prompt: task.prompt,
      sample_count: task.sample_count,
      interval_seconds: task.interval_seconds,
      smoothing_level: task.smoothing_level,
      enabled: task.enabled,
      public_enabled: task.public_enabled,
    });
  }, [task]);

  /** 业务说明：提交任务配置，按创建或更新场景调用上层工作台业务动作。 */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
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
          <Field label="任务名称">
            <Input value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Provider">
            <Select value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value as TaskPayload["provider"] })}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </Select>
          </Field>
          <Field label="Base URL">
            <Input value={form.base_url} required onChange={(event) => setForm({ ...form, base_url: event.target.value })} />
          </Field>
          <Field label={task ? "API Key（留空沿用）" : "API Key"}>
            <Input type="password" value={form.api_key ?? ""} required={!task} onChange={(event) => setForm({ ...form, api_key: event.target.value })} />
          </Field>
          <Field label="模型名称">
            <Input value={form.model} required onChange={(event) => setForm({ ...form, model: event.target.value })} />
          </Field>
          <Field label="选择参照">
            <Select
              required
              value={form.reference_id}
              onChange={(event) => setForm({ ...form, reference_id: event.target.value })}
            >
              <option value="">请选择已标定的参照</option>
              {references.map((reference) => (
                <option key={reference.id} value={reference.id}>
                  {reference.name} / {reference.model}
                  {reference.latest_run_id ? "" : "（未运行）"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="采样次数">
            <Input type="number" min={10} max={500} value={form.sample_count} onChange={(event) => setForm({ ...form, sample_count: Number(event.target.value) })} />
          </Field>
          <Field label="间隔秒数">
            <Input type="number" min={60} value={form.interval_seconds} onChange={(event) => setForm({ ...form, interval_seconds: Number(event.target.value) })} />
          </Field>
          <Field label={`平滑度 ${form.smoothing_level}`}>
            <Input type="range" min={0} max={100} value={form.smoothing_level} onChange={(event) => setForm({ ...form, smoothing_level: Number(event.target.value) })} />
          </Field>
        </div>
        <Field label="Prompt">
          <Textarea value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} />
        </Field>
        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} />
            启用调度
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.public_enabled} onChange={(event) => setForm({ ...form, public_enabled: event.target.checked })} />
            公开展示
          </label>
        </div>
        <Button className="w-full" type="submit" disabled={isSaving}>
          <Save className="h-4 w-4" />
          {isSaving ? "保存中" : "保存任务"}
        </Button>
      </form>
    </Card>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

/** 业务说明：包装表单字段标签和控件，保持任务配置录入的扫描节奏一致。 */
function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
