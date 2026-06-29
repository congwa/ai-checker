/** 业务说明：后台登录工具测试，确保固定密钥和本地登录态符合管理入口规则。 */
import { describe, expect, it } from "vitest";
import { ADMIN_AUTH_STORAGE_KEY } from "@/lib/config/auth";
import { canLogin, clearAuthSession, persistAuthSession, readAuthSession } from "@/lib/auth";

describe("admin auth helpers", () => {
  it("accepts only the configured admin secret", () => {
    expect(canLogin("zhangzongkang")).toBe(true);
    expect(canLogin(" wrong ")).toBe(false);
  });

  it("persists and clears local browser session", () => {
    clearAuthSession();
    expect(readAuthSession()).toBe(false);
    persistAuthSession();
    expect(window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)).toBe("1");
    expect(readAuthSession()).toBe(true);
    clearAuthSession();
    expect(readAuthSession()).toBe(false);
  });
});

