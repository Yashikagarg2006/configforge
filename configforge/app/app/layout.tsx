"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { I18nProvider } from "@/contexts/I18nContext";
import { SafeConfig } from "@/types/config";
import { normalizeConfig } from "@/lib/config-normalizer";

const NAV_ICONS: Record<string, string> = {
  "/dashboard": "📊", "/config-editor": "⚙️", "/csv-import": "📤",
  "/notifications": "🔔", "/app": "🚀",
};

function Sidebar({ config, appName }: { config: SafeConfig; appName: string }) {
  const pathname = usePathname();
  const pages = config.pages ?? [];

  const topLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/config-editor", label: "Config Editor" },
    { href: "/csv-import", label: "CSV Import" },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-white/8 bg-black/20 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm">⚡</div>
          <span className="font-bold text-white">ConfigForge</span>
        </Link>
        {appName && <p className="text-white/40 text-xs mt-1 truncate pl-10">{appName}</p>}
      </div>

      {/* System nav */}
      <nav className="px-3 py-3 border-b border-white/8 space-y-0.5">
        {topLinks.map((l) => (
          <Link key={l.href} href={l.href} className={`sidebar-item flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm border border-transparent ${isActive(l.href) ? "active text-white" : "text-white/50 hover:text-white"}`}>
            <span>{NAV_ICONS[l.href]}</span>{l.label}
          </Link>
        ))}
      </nav>

      {/* Generated app pages */}
      {pages.length > 0 && (
        <div className="px-3 py-3 flex-1 overflow-y-auto">
          <p className="text-white/25 text-xs font-semibold uppercase tracking-widest px-3 mb-2">App Pages</p>
          <div className="space-y-0.5">
            {pages.map((page) => {
              const slug = page.route.replace(/^\//, "");
              const href = `/app/${slug}`;
              return (
                <Link key={page.route} href={href} className={`sidebar-item flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm border border-transparent ${isActive(href) ? "active text-white" : "text-white/50 hover:text-white"}`}>
                  <span className="text-violet-400">▸</span>
                  <span className="truncate">{page.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom: notifications + signout */}
      <div className="px-3 py-3 border-t border-white/8 space-y-0.5">
        <Link href="/notifications" className={`sidebar-item flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm border border-transparent ${isActive("/notifications") ? "active text-white" : "text-white/50 hover:text-white"}`}>
          🔔 Notifications
        </Link>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="sidebar-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-rose-400 border border-transparent transition-colors">
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SafeConfig | null>(null);
  const [appName, setAppName] = useState("My App");

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/configs");
      if (!res.ok) return;
      const data = await res.json();
      if (data.configs?.length > 0) {
        // Fetch the most recent config's full data
        const cfgRes = await fetch(`/api/configs/${data.configs[0].id}`);
        if (cfgRes.ok) {
          const cfgData = await cfgRes.json();
          const { config: normalized } = normalizeConfig(cfgData.config?.config ?? {});
          setConfig(normalized);
          setAppName(normalized.appName);
        }
      }
    } catch {}
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const fallbackConfig: SafeConfig = {
    appName: "My App", auth: { enabled: true },
    i18n: { default: "en", languages: ["en"], translations: {} },
    database: { tables: {} }, pages: [], apis: [], notifications: [],
  };

  const activeConfig = config ?? fallbackConfig;

  return (
    <I18nProvider config={activeConfig}>
      <div className="flex min-h-screen">
        <Sidebar config={activeConfig} appName={appName} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="h-14 border-b border-white/8 flex items-center justify-end gap-3 px-6 bg-black/10 shrink-0">
            <LanguageSwitcher />
            <NotificationBell />
          </header>
          <main className="flex-1 p-6 page-enter">
            {children}
          </main>
        </div>
      </div>
    </I18nProvider>
  );
}
