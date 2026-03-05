"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  userName,
  logoutAction
}: {
  userName: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  return (
    <aside className="side-menu">
      <div>
        <h2>Ghost Labor</h2>
        <p className="side-user">{userName}</p>
      </div>

      <nav className="menu-links">
        <Link className={isActive(pathname, "/dashboard") ? "active" : ""} href="/dashboard">
          Dashboard
        </Link>

        <Link className={isActive(pathname, "/connectors") ? "active" : ""} href="/connectors">
          Connectors
        </Link>

        <Link className={isActive(pathname, "/run-reports") ? "active" : ""} href="/run-reports">
          Run Reports
        </Link>

        <Link className={isActive(pathname, "/settings") ? "active" : ""} href="/settings">
          Settings
        </Link>
      </nav>

      <form action={logoutAction} className="side-logout-wrap">
        <button type="submit" className="logout-btn side-logout-btn">
          Logout
        </button>
      </form>
    </aside>
  );
}
