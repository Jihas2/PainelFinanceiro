"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Finanças", icon: "💰" },
  { href: "/contratos", label: "Contratos", icon: "📄" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 bg-surface border-r border-border min-h-screen flex flex-col">
      <div className="px-6 py-7 border-b border-border">
        <h1 className="text-lg font-semibold text-slate-100">Painel</h1>
        <p className="text-xs text-muted mt-1">Gerenciamento pessoal</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-accent/15 text-white border border-accent/30"
                  : "text-slate-300 hover:bg-surfaceAlt"
              }`}
            >
              <span className="text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2.5 rounded-md text-sm text-slate-400 hover:bg-surfaceAlt hover:text-slate-200 transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
