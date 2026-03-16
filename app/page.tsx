import { redirect } from "next/navigation";
import { getAuthenticatedUser, loginWithPassword } from "@/lib/auth/session";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getAuthenticatedUser();
  const params = await searchParams;

  if (user) {
    redirect("/dashboard");
  }

  async function loginAction(formData: FormData) {
    "use server";

    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    const success = await loginWithPassword(username, password);

    if (!success) {
      redirect("/?error=invalid_credentials");
    }

    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>Ghost Labor Detector</h1>
        <p>Login to access dashboard, connectors, and settings.</p>
        <form action={loginAction} className="login-form">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" required />

          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />

          {params.error === "invalid_credentials" ? (
            <p className="form-error">Invalid username or password.</p>
          ) : null}

          <button type="submit">Login</button>
        </form>
      </section>
    </main>
  );
}
