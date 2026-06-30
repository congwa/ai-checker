/** 业务说明：管理端应用入口，负责登录页与后台工作台之间的访问切换。 */
import { AdminDashboardPage } from "@/components/admin/AdminDashboardPage";
import { LoginPage } from "@/components/admin/LoginPage";
import { Toaster } from "@/components/ui/sonner";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { ADMIN_TOKEN } from "@/lib/config/auth";

/** 业务说明：根据本地登录态决定展示登录页或加载后台管理数据。 */
export default function App() {
  const auth = useAdminAuth();
  const page = auth.isAuthenticated ? (
    <AdminDashboardPage token={ADMIN_TOKEN} onLogout={auth.logout} />
  ) : (
    <LoginPage onLogin={auth.login} />
  );

  return (
    <>
      {page}
      <Toaster />
    </>
  );
}
