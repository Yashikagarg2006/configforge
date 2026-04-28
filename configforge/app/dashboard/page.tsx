import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { normalizeConfig } from "@/lib/config-normalizer";
import Link from "next/link";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const configs = await prisma.appConfig.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const totalRecords = await prisma.dynamicRecord.count({ where: { userId: session.user.id } });
  const unreadNotifs = await prisma.notification.count({ where: { userId: session.user.id, read: false } });

  const latestConfig = configs[0];
  let appName = "No config yet";
  let pageCount = 0;
  let tableCount = 0;

  if (latestConfig) {
    const { config } = normalizeConfig(latestConfig.config);
    appName = config.appName;
    pageCount = config.pages.length;
    tableCount = Object.keys(config.database.tables).length;
  }

  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Welcome back, {session.user.name ?? session.user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active App", value: appName, icon: "⚡", color: "from-violet-600/30 to-violet-800/20 border-violet-500/30" },
          { label: "Total Records", value: totalRecords.toLocaleString(), icon: "🗃️", color: "from-cyan-600/30 to-cyan-800/20 border-cyan-500/30" },
          { label: "App Pages", value: pageCount, icon: "📄", color: "from-emerald-600/30 to-emerald-800/20 border-emerald-500/30" },
          { label: "Notifications", value: unreadNotifs, icon: "🔔", color: "from-amber-600/30 to-amber-800/20 border-amber-500/30" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-white truncate">{stat.value}</div>
            <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { href: "/config-editor", icon: "⚙️", title: "Edit Config", desc: "Modify your app JSON config" },
          { href: "/app", icon: "🚀", title: "Preview App", desc: "View your generated app" },
          { href: "/csv-import", icon: "📤", title: "Import CSV", desc: "Bulk import data from CSV files" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="glass rounded-2xl p-5 hover:bg-white/8 transition-all hover:scale-[1.02] group">
            <div className="text-3xl mb-3">{a.icon}</div>
            <h3 className="font-semibold text-white group-hover:text-violet-300 transition">{a.title}</h3>
            <p className="text-white/40 text-sm mt-1">{a.desc}</p>
          </Link>
        ))}
      </div>

      {/* Saved configs */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Saved Configs</h2>
          <Link href="/config-editor" className="text-violet-400 hover:text-violet-300 text-sm transition">+ New Config</Link>
        </div>
        {configs.length === 0 ? (
          <div className="text-center py-10 text-white/30">
            <div className="text-4xl mb-2">📭</div>
            <p>No configs yet. <Link href="/config-editor" className="text-violet-400 hover:underline">Create your first app</Link></p>
          </div>
        ) : (
          <div className="space-y-2">
            {configs.map((c) => {
              const { config } = normalizeConfig(c.config);
              return (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/8 transition">
                  <div>
                    <p className="font-medium text-white">{c.name}</p>
                    <p className="text-white/40 text-xs mt-0.5">{config.pages.length} pages · {Object.keys(config.database.tables).length} tables · Updated {new Date(c.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <Link href="/app" className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-lg transition">Open →</Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
