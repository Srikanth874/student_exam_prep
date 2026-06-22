"use client";

import Link from "next/link";
import { ArrowRight, BrainCircuit, CheckCircle2, FileStack, LockKeyhole, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const features = [
  "Supabase email authentication",
  "Protected student dashboard",
  "Storage-ready upload workflow",
  "Gemini-backed paper generation"
];

const consoleItems: Array<{
  title: string;
  detail: string;
  Icon: LucideIcon;
}> = [
  { title: "Notes", detail: "84 pages indexed", Icon: FileStack },
  { title: "Question Bank", detail: "312 questions mapped", Icon: BrainCircuit },
  { title: "PYQs", detail: "Pattern ready", Icon: LockKeyhole }
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-spot left-12 top-24 h-40 w-40 bg-aurora/20" />
        <div className="hero-spot left-1/2 top-10 h-72 w-72 bg-violet/20" />
        <div className="hero-spot right-16 top-32 h-56 w-56 bg-solar/15" />
      </div>
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-aurora/15 text-aurora shadow-glow">
            <Sparkles className="h-5 w-5" />
          </span>
          EduForge AI
        </Link>
        <div className="flex items-center gap-3">
          <Link className="hidden rounded-lg px-4 py-2 text-sm text-slate-300 transition hover:text-white sm:block" href="/login">
            Log in
          </Link>
          <Link className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-aurora" href="/register">
            Register
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-5.5rem)] w-full max-w-7xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-[1.03fr_0.97fr]">
        <div className="animate-[fadeUp_0.65s_ease-out_both]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-lg border border-aurora/25 bg-aurora/10 px-3 py-2 text-sm font-medium text-aurora">
            <BrainCircuit className="h-4 w-4" />
            Exam generation workspace
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your AI-powered exam engineering suite
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A premium learning platform built to feel polished, modern, and intelligent — transforming notes, question banks, and PYQs into exam-ready outputs with silky-smooth motion.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="group inline-flex items-center justify-center gap-2 rounded-lg bg-aurora px-5 py-3 font-semibold text-slate-950 transition hover:bg-teal-200" href="/register">
              Build your paper
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link className="inline-flex items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] px-5 py-3 font-semibold text-white transition hover:border-white/25" href="/login">
              Open dashboard
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-aurora" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-[riseIn_0.8s_ease-out_0.12s_both]" style={{ perspective: 1400 }}>
          <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-aurora/15 via-violet/10 to-solar/10 blur-3xl opacity-80" />
          <div className="relative interactive-panel mesh-surface animate-float rounded-[2rem] border border-white/12 p-5 shadow-depth">
            <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Generation Console</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Question Paper Builder</h2>
                </div>
                <span className="rounded-lg bg-aurora/15 px-3 py-2 text-sm font-medium text-aurora">Live</span>
              </div>

              <div className="grid gap-4">
                {consoleItems.map(({ title, detail, Icon }) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 text-aurora">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-white">{title}</h3>
                        <p className="text-sm text-slate-400">{detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-gradient-to-r from-aurora via-white to-solar bg-[length:200%_100%] p-px animate-shimmer">
                <div className="rounded-xl bg-slate-950 px-5 py-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Readiness</span>
                    <span className="font-semibold text-aurora">96%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[96%] rounded-full bg-aurora" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
