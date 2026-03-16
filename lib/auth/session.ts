import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";

const SESSION_COOKIE = "ghost_session";

type LoginUserRecord = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: string;
};

async function findLoginUserByUsername(username: string): Promise<LoginUserRecord | null> {
  const delegate = (prisma as { loginUser?: typeof prisma.loginUser }).loginUser;

  if (delegate) {
    const user = await delegate.findUnique({
      where: { username }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role
    };
  }

  const rows = await prisma.$queryRaw<LoginUserRecord[]>`
    SELECT id, username, password, "fullName", role
    FROM "LoginUser"
    WHERE username = ${username}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const username = cookieStore.get(SESSION_COOKIE)?.value;

  if (!username) {
    return null;
  }

  const user = await findLoginUserByUsername(username);

  return user;
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function loginWithPassword(username: string, password: string) {
  const user = await findLoginUserByUsername(username);

  if (!user || user.password !== password) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, user.username, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return true;
}

export async function logoutSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
