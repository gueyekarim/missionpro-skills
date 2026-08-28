import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { SignOutButton } from "./sign-out-button";

const navigation = [
  { href: "/app", label: "Home" },
  { href: "/app/capabilities", label: "Capabilities" },
  { href: "/app/path", label: "My Path" },
  { href: "/app/nova", label: "NOVA" },
  { href: "/app/practice", label: "Practice" },
  { href: "/app/evidence", label: "Evidence" },
  { href: "/app/passport", label: "Passport" },
  { href: "/app/status", label: "System status" }
];

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">MissionPro <span>Skills</span></div>
        <nav className="nav" aria-label="Navigation principale">
          {navigation.map((item) => <Link className="nav-link" href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
        <div className="sidebar-bottom">
          <p>Capability → Evidence → Mastery</p>
          <SignOutButton />
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <span className="eyebrow">Individual Mode · Sprint 0</span>
          <span className="topbar-user">{user.name ?? user.email}</span>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}