"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);
    if (!res) {
      toast.error("Sign-in failed (no response). Try again.");
      return;
    }
    if (res.error) {
      toast.error("Invalid email or password");
      return;
    }
    if (res.ok === false) {
      toast.error("Sign-in failed. Please try again.");
      return;
    }
    const cb = params.get("callbackUrl") ?? "/dashboard";
    router.push(cb);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
        <input
          type="email" required autoComplete="email"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
        <input
          type="password" required autoComplete="current-password"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit" disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 text-white font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</> : "Sign In"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xl">⚡</div>
            <span className="text-2xl font-bold gradient-text">ConfigForge</span>
          </Link>
          <p className="text-white/40 mt-2 text-sm">Sign in to your account</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <Suspense fallback={<div className="flex justify-center p-4"><span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}>
            <LoginForm />
          </Suspense>

          <p className="text-center text-white/40 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 transition">Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
