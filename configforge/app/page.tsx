import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "ConfigForge — JSON-Driven App Generator",
  description: "Build full-stack apps from JSON config. Dynamic UI, APIs, database, auth, and more.",
};

const FEATURES = [
  { icon: "⚙️", title: "Config-Driven", desc: "One JSON file generates your entire app — UI, APIs, DB schema, auth, and i18n." },
  { icon: "🧩", title: "Component Registry", desc: "Extensible renderer: form, table, dashboard, chart. Add new types with one line." },
  { icon: "🔒", title: "Auth + User Scope", desc: "Email/password auth. Every record is scoped to the logged-in user automatically." },
  { icon: "📤", title: "CSV Import", desc: "Upload any CSV, map columns to config fields, import in bulk with per-row error tracking." },
  { icon: "🌍", title: "Localization", desc: "Config-driven i18n. Switch languages live. Missing keys fall back gracefully." },
  { icon: "🔔", title: "Smart Notifications", desc: "Events fire toast + DB notifications on create/update/delete/import actions." },
  { icon: "🛡️", title: "Safe by Design", desc: "Config normalizer repairs missing fields. Unknown components show warnings, never crash." },
  { icon: "🚀", title: "Any Resource", desc: "Students, tasks, products, leads, orders, employees — config drives everything." },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-white/8 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm">⚡</div>
          <span className="font-bold text-white text-lg">ConfigForge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-white/60 hover:text-white text-sm transition px-3 py-1.5">Sign In</Link>
          <Link href="/signup" className="text-sm font-semibold px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition">Get Started →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-sm font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          JSON → Full-Stack App in seconds
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
          Build apps from<br />
          <span className="gradient-text">JSON config</span>
        </h1>

        <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          ConfigForge reads a structured JSON config and dynamically generates your entire frontend UI,
          backend APIs, database storage, authentication, CSV import, and localization.
          No hardcoding. Any resource.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-bold text-lg transition-all hover:scale-[1.03] shadow-lg shadow-violet-500/25">
            Start Building Free →
          </Link>
          <Link href="/login" className="px-8 py-4 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 font-semibold text-lg transition-all">
            Sign In
          </Link>
        </div>
      </section>

      {/* Config preview */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="glass rounded-3xl p-6 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="ml-3 text-white/30 text-xs font-mono">app.config.json</span>
          </div>
          <pre className="text-sm font-mono text-white/70 overflow-x-auto leading-relaxed">
{`{
  "appName": "Student Manager",
  "database": {
    "tables": {
      "students": {
        "fields": {
          "name":  { "type": "string",  "required": true },
          "email": { "type": "email",   "required": true },
          "marks": { "type": "number"  }
        }
      }
    }
  },
  "pages": [{
    "route": "/students", "title": "Students",
    "components": [
      { "type": "heading", "text": "Students" },
      { "type": "form",    "table": "students" },
      { "type": "table",   "table": "students" }
    ]
  }],
  "apis": [{ "resource": "students", "actions": ["create","read","update","delete"] }]
}`}
          </pre>
          <div className="mt-4 pt-4 border-t border-white/8 flex items-center gap-6 text-xs text-white/30">
            <span>✨ Generates UI</span><span>🔌 Creates REST API</span><span>🗄️ Stores in PostgreSQL</span><span>🔒 Auth protected</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center text-white mb-3">Everything generated from config</h2>
        <p className="text-white/40 text-center mb-12">Works for students, tasks, products, leads, orders, employees — any resource</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:bg-white/8 transition-all hover:scale-[1.02]">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto text-center px-6 pb-24">
        <div className="glass rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to build?</h2>
          <p className="text-white/40 mb-8">Sign up free. Paste your JSON config. Your app is live in minutes.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-bold text-lg transition-all hover:scale-[1.03]">
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-8 text-center text-white/25 text-sm">
        <p>ConfigForge — JSON-Driven App Generator · Built with Next.js, Prisma, PostgreSQL</p>
      </footer>
    </div>
  );
}
