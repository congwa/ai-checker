/** 业务说明：后台登录页组件，在进入任务管理工作台前校验本地管理密钥。 */
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

interface LoginPageProps {
  onLogin: (secret: string) => boolean;
}

/** 业务说明：渲染后台访问入口，只有密钥正确才允许加载管理数据和任务操作。 */
export function LoginPage({ onLogin }: LoginPageProps) {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  /** 业务说明：提交管理员密钥并反馈校验结果，避免错误密钥触发后台 API 请求。 */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onLogin(secret)) {
      setError(null);
      return;
    }
    setError("密钥不正确，请重新输入。");
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-sky-300 to-amber-300" />
          <div className="flex items-center gap-3">
            <img
              className="h-11 w-11 rounded-md object-contain shadow-[0_0_0_1px_rgba(45,212,191,.22)]"
              src="/codexbuy-logo.png"
              alt=""
              aria-hidden="true"
            />
            <div>
              <div className="text-sm font-semibold text-teal-200">AI Checker Admin</div>
              <h1 className="text-2xl font-bold text-slate-50">后台登录</h1>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="admin-secret">访问密钥</Label>
              <Input
                id="admin-secret"
                type="password"
                autoFocus
                value={secret}
                placeholder="输入后台访问密钥"
                onChange={(event) => setSecret(event.target.value)}
              />
            </div>
            {error ? (
              <div className="rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
            <Button className="w-full" type="submit">
              <LockKeyhole className="h-4 w-4" />
              进入后台
            </Button>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
