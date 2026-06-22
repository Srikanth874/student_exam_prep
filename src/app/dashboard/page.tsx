"use client";

import { useRouter } from "next/navigation";
import { BarChart3, LogOut, Sparkles, Wand2 } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardForm } from "@/components/DashboardForm";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "study-materials";
  const router = useRouter();
  const { user, signOut } = useAuth();
  const displayName =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "Learner";

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(94,234,212,0.06),transparent_18rem),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.05),transparent_22rem)] px-5 py-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-depth backdrop-blur-md interactive-panel md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-aurora/15 text-aurora">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-slate-400">Welcome back, {displayName}</p>
                <h1 className="text-2xl font-semibold tracking-tight text-white">EduForge Dashboard</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-red-300/40 hover:text-red-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </header>

          <section className="grid gap-6 lg:grid-cols-[0.72fr_0.28fr]">
            <div className="glass-panel rounded-2xl p-5 md:p-7">
              <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium text-aurora">Input materials</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-white">Generate an exam-ready response set</h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-slate-400">
                  Upload any one source or combine all three for stronger context.
                </p>
              </div>
              <DashboardForm user={user} />
            </div>

            <aside className="grid gap-5">
              <section className="mesh-surface rounded-[1.75rem] border border-white/10 p-6 shadow-depth interactive-panel">
                <Wand2 className="mb-5 h-7 w-7 text-aurora" />
                <h3 className="text-xl font-semibold text-white">Workflow Status</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Gemini is the primary generation engine. It will process uploaded files and return an exam-ready draft.
                </p>
              </section>

              <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 interactive-panel">
                <BarChart3 className="mb-5 h-7 w-7 text-solar" />
                <h3 className="text-xl font-semibold text-white">Configuration</h3>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <div className="flex justify-between gap-4">
                    <span>Auth</span>
                    <span className="font-medium text-aurora">Supabase</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Storage bucket</span>
                    <span className="font-medium text-aurora">{bucketName}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Automation</span>
                    <span className="font-medium text-aurora">Gemini</span>
                  </div>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
