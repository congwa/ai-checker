/** 业务说明：参照配置表单组件，用于录入可单独标定的 AI 基准配置。 */
import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { StatusIcon } from "@/components/ui/status";
import { cn } from "@/lib/utils";
import type { ReferencePayload } from "@/types/domain";

const DEFAULT_PROMPT = "请从1到355之间随机选择一个数字，只输出这个数字，不要有任何其他内容。";

interface ReferenceFormProps {
  compact?: boolean;
  onSubmit: (payload: ReferencePayload) => Promise<void>;
}

const emptyForm: ReferencePayload = {
  name: "",
  provider: "openai",
  base_url: "https://api.openai.com/v1",
  api_key: "",
  model: "",
  prompt: DEFAULT_PROMPT,
  sample_count: 50,
};

/** 业务说明：渲染新增参照表单，保存后用户可手动运行标定生成基准分布。 */
export function ReferenceForm({ compact = false, onSubmit }: ReferenceFormProps) {
  const [form, setForm] = useState<ReferencePayload>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  /** 业务说明：提交参照配置，成功后清空表单以便继续录入其他参照。 */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit(form);
      setForm(emptyForm);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardTitle>新增参照</CardTitle>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className={cn("grid gap-3", compact ? "grid-cols-1" : "md:grid-cols-2")}>
          <Field label="参照名称" htmlFor="reference-name">
            <Input id="reference-name" value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </Field>
          <Field label="Provider" htmlFor="reference-provider">
            <Select
              id="reference-provider"
              value={form.provider}
              onChange={(event) => setForm({ ...form, provider: event.target.value as ReferencePayload["provider"] })}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </Select>
          </Field>
          <Field label="Base URL" htmlFor="reference-base-url">
            <Input id="reference-base-url" value={form.base_url} required onChange={(event) => setForm({ ...form, base_url: event.target.value })} />
          </Field>
          <Field label="API Key" htmlFor="reference-api-key">
            <Input id="reference-api-key" type="password" value={form.api_key ?? ""} required onChange={(event) => setForm({ ...form, api_key: event.target.value })} />
          </Field>
          <Field label="模型名称" htmlFor="reference-model">
            <Input id="reference-model" value={form.model} required onChange={(event) => setForm({ ...form, model: event.target.value })} />
          </Field>
          <Field label="标定次数" htmlFor="reference-sample-count">
            <Input
              id="reference-sample-count"
              type="number"
              min={10}
              max={500}
              value={form.sample_count}
              onChange={(event) => setForm({ ...form, sample_count: Number(event.target.value) })}
            />
          </Field>
        </div>
        <Field label="Prompt" htmlFor="reference-prompt">
          <Textarea id="reference-prompt" value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} />
        </Field>
        <Button className="w-full md:w-auto" type="submit" disabled={isSaving} aria-busy={isSaving}>
          {isSaving ? <StatusIcon status="running" /> : <Save className="h-4 w-4" />}
          {isSaving ? "保存中" : "保存参照"}
        </Button>
      </form>
    </Card>
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

/** 业务说明：包装参照表单字段，保持标定配置录入的业务节奏一致。 */
function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
