/** 业务说明：后台登录态 Hook，集中管理登录、退出和本地会话恢复。 */
import { useCallback, useState } from "react";
import { canLogin, clearAuthSession, persistAuthSession, readAuthSession } from "@/lib/auth";

/** 业务说明：向页面提供后台登录状态和登录动作，避免组件直接操作 localStorage。 */
export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(readAuthSession);

  /** 业务说明：处理管理员输入密钥后的登录判断，成功后写入本地会话。 */
  const login = useCallback((secret: string) => {
    if (!canLogin(secret)) return false;
    persistAuthSession();
    setIsAuthenticated(true);
    return true;
  }, []);

  /** 业务说明：处理管理员退出，清理本地会话并回到登录页。 */
  const logout = useCallback(() => {
    clearAuthSession();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}

