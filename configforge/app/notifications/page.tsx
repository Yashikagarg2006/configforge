import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { markAllRead } from "@/lib/notifications";

export const metadata = { title: "Notifications" };

async function MarkAllReadButton() {
  return null; // Handled client-side via the API
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const TYPE_COLORS: Record<string, string> = {
    toast: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    db:    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    both:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };

  const groupByDate = (notifs: typeof notifications) => {
    const groups: Record<string, typeof notifications> = {};
    for (const n of notifs) {
      const date = new Date(n.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(n);
    }
    return groups;
  };

  const grouped = groupByDate(notifications);

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-white/40 text-sm mt-1">{notifications.length} total · {notifications.filter((n) => !n.read).length} unread</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <form action={async () => { "use server"; await markAllRead(session.user.id); }}>
            <button type="submit" className="text-sm text-violet-400 hover:text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-lg transition">
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <h2 className="text-white/60 font-medium">No notifications yet</h2>
          <p className="text-white/30 text-sm mt-2">Create, update, or delete records to see notifications here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, notifs]) => (
            <div key={date}>
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">{date}</p>
              <div className="space-y-2">
                {notifs.map((n) => (
                  <div key={n.id} className={`glass rounded-xl p-4 flex items-start gap-3 transition-all ${!n.read ? "border-violet-500/20" : ""}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-violet-400" : "bg-white/15"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "text-white" : "text-white/70"}`}>{n.message}</p>
                      <p className="text-white/30 text-xs mt-1">
                        {new Date(n.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${TYPE_COLORS[n.type] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}>
                      {n.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
