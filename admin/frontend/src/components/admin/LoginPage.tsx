/** 业务说明：后台登录页组件，在进入任务管理工作台前校验本地管理密钥。 */
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Activity, LockKeyhole, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
        className="w-full max-w-4xl"
      >
        <Card className="relative grid overflow-hidden p-0 md:grid-cols-[0.88fr_1fr]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#b7f860] via-[#39e6c1] to-[#ffb84d]" />
          <section className="hidden min-h-[380px] border-r border-white/[0.12] bg-[linear-gradient(145deg,rgba(183,248,96,0.12),rgba(8,10,11,0.18)_42%,rgba(255,184,77,0.1))] p-7 md:flex md:flex-col md:justify-between">
            <div className="flex items-center gap-3">
              <img
                className="h-12 w-12 rounded-md bg-black/30 object-contain p-1 shadow-[0_0_0_1px_rgba(183,248,96,.28)]"
                src="/codexbuy-logo.png"
                alt=""
                aria-hidden="true"
              />
              <div>
                <div className="font-display text-base font-semibold text-[#f4f7ef]">AI Checker Ops</div>
                <div className="mt-1 text-xs font-medium text-slate-400">codexbuy 渠道监测</div>
              </div>
            </div>

            <div>
              <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/[0.11] bg-black/20 p-3">
                  <ShieldCheck className="h-4 w-4 text-[#b7f860]" />
                  <div className="mt-3 text-xs font-semibold text-slate-500">Access</div>
                  <div className="mt-1 text-lg font-bold text-slate-100">Protected</div>
                </div>
                <div className="rounded-lg border border-white/[0.11] bg-black/20 p-3">
                  <Activity className="h-4 w-4 text-[#39e6c1]" />
                  <div className="mt-3 text-xs font-semibold text-slate-500">Mode</div>
                  <div className="mt-1 text-lg font-bold text-slate-100">Monitor</div>
                </div>
              </div>
              <div className="font-display text-4xl font-bold leading-tight text-[#f6f8f0]">Ops Control</div>
              <div className="mt-4 flex gap-2">
                <span className="h-1.5 w-10 rounded-full bg-[#b7f860]" />
                <span className="h-1.5 w-5 rounded-full bg-[#39e6c1]" />
                <span className="h-1.5 w-3 rounded-full bg-[#ffb84d]" />
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8">
            <div className="flex items-center gap-3 md:hidden">
              <img
                className="h-11 w-11 rounded-md bg-black/30 object-contain p-1 shadow-[0_0_0_1px_rgba(183,248,96,.22)]"
                src="/codexbuy-logo.png"
                alt=""
                aria-hidden="true"
              />
              <div>
                <div className="text-sm font-semibold text-[#d8ff8f]">codexbuy 渠道监测</div>
                <h1 className="font-display text-2xl font-bold text-slate-50">后台登录</h1>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-[#d8ff8f]">codexbuy 渠道监测</div>
              <h1 className="mt-1 font-display text-3xl font-bold text-slate-50">后台登录</h1>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
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
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Button className="w-full" type="submit">
                <LockKeyhole className="h-4 w-4" />
                进入后台
              </Button>
            </form>
          </section>
        </Card>
      </motion.div>
    </main>
  );
}
