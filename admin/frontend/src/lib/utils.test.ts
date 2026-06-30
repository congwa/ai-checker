/** 业务说明：管理端通用展示工具测试，确保异常数据不会破坏后台操作体验。 */
import { describe, expect, it } from "vitest";
import { cn, formatDateTime } from "@/lib/utils";

describe("admin display utilities", () => {
  it("merges conflicting tailwind classes for reusable business components", () => {
    expect(cn("h-8", "h-11")).toBe("h-11");
  });

  it("formats valid timestamps and hides invalid raw date values from users", () => {
    expect(formatDateTime(null)).toBe("未生成");
    expect(formatDateTime("not-a-date")).toBe("未记录");
    expect(formatDateTime(1)).toContain("1970");
  });
});
