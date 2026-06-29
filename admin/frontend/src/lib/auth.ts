/** 业务说明：后台登录工具，负责本地密钥校验和浏览器登录态读写。 */
import { ADMIN_AUTH_STORAGE_KEY, ADMIN_TOKEN } from "@/lib/config/auth";

/** 业务说明：校验用户输入的后台访问密钥，只有匹配固定管理密钥才允许进入工作台。 */
export function canLogin(secret: string) {
  return secret.trim() === ADMIN_TOKEN;
}

/** 业务说明：读取浏览器本地登录态，决定管理端首次打开时是否直接进入工作台。 */
export function readAuthSession() {
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "1";
}

/** 业务说明：持久化本地登录态，让刷新页面后管理员无需重复输入密钥。 */
export function persistAuthSession() {
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "1");
}

/** 业务说明：清除本地登录态，用于管理员主动退出后台工作台。 */
export function clearAuthSession() {
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}

