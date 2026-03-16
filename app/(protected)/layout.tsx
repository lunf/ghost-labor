import { redirect } from "next/navigation";
import { Sidebar } from "@/app/components/Sidebar";
import { logoutSession, requireAuth } from "@/lib/auth";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  async function logoutAction() {
    "use server";
    await logoutSession();
    redirect("/");
  }

  return (
    <div className="app-shell">
      <Sidebar userName={user.fullName} logoutAction={logoutAction} />
      <section className="content-shell">{children}</section>
    </div>
  );
}
