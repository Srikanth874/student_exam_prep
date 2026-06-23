"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Tilt } from "@/components/Tilt";

interface AuthCardProps {
  mode: "login" | "register" | "forgot-password";
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isReset = mode === "forgot-password";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        throw new Error("Please enter a valid email address.");
      }

      if (isReset) {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail })
        });

        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || "Unable to send reset email.");
        }

        setMessage(
          "If that email is registered, you'll receive password reset instructions shortly. Check your inbox."
        );
        return;
      }

      if (!password || password.length < 6) {
        throw new Error("Please enter a password with at least 6 characters.");
      }

      if (isRegister && !name.trim()) {
        throw new Error("Please enter your full name to create your account.");
      }

      if (isLogin) {
        await signIn(normalizedEmail, password);
      } else {
        await signUp(normalizedEmail, password, name.trim());
      }

      router.replace("/dashboard");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Authentication failed. Please check your credentials and try again."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(94,234,212,0.08),transparent_32%,rgba(251,191,36,0.08)_64%,transparent)]" />

      <div
        className="relative w-full max-w-md animate-[riseIn_0.7s_ease-out_both]"
        style={{ perspective: 1200 }}
      >
        {/* Stacked glass sheets peeking out behind the main card */}
        <span
          aria-hidden="true"
          className="ghost-layer rounded-[2rem] translate-x-4 translate-y-6 rotate-[3deg]"
        />
        <span
          aria-hidden="true"
          className="ghost-layer rounded-[2rem] translate-x-2 translate-y-3 rotate-[1.5deg]"
        />

        <Tilt
          max={5}
          className="glass-panel interactive-panel relative overflow-hidden rounded-[2rem] p-7 shadow-depth"
        >
          <div className="pointer-events-none absolute inset-x-6 -top-10 z-0 flex justify-between">
            <span className="hero-spot h-24 w-24 bg-aurora/20" />
            <span className="hero-spot h-28 w-28 bg-violet/20" />
          </div>

          <Link href="/" className="mb-8 flex items-center gap-2 text-sm text-slate-300">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-aurora/15 text-aurora">
              <Sparkles className="h-5 w-5" />
            </span>
            EduForge AI
          </Link>

          <div className="mb-7">
            <p className="mb-2 text-sm font-medium text-aurora">
              {isLogin
                ? "Welcome back"
                : isRegister
                ? "Start building"
                : "Password recovery"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {isLogin
                ? "Log in to your workspace"
                : isRegister
                ? "Create your account"
                : "Reset your password"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {isLogin
                ? "Continue building smarter lessons, quizzes, and study assets with your EduForge AI account."
                : isRegister
                ? "Create your account to unlock AI-powered educational content and personalized workflows."
                : "Enter your email and we’ll send you a secure reset link so you can get back to learning."}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegister ? (
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Full name</span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition focus:border-aurora/70 focus:ring-2 focus:ring-aurora/20"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  required
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition focus:border-aurora/70 focus:ring-2 focus:ring-aurora/20"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            {!isReset ? (
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Password</span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 py-3 text-white outline-none transition focus:border-aurora/70 focus:ring-2 focus:ring-aurora/20"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </label>
            ) : null}

            {isLogin ? (
              <div className="text-right text-sm">
                <Link href="/forgot-password" className="font-medium text-aurora hover:text-teal-200">
                  Forgot password?
                </Link>
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                aria-live="polite"
                className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
              >
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-aurora px-4 py-3 font-semibold text-slate-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {isReset ? "Send reset email" : isLogin ? "Log in" : "Create account"}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isLogin
              ? "No account yet?"
              : isRegister
              ? "Already registered?"
              : "Remembered your password?"}{" "}
            <Link
              className="font-medium text-aurora"
              href={isLogin ? "/register" : isRegister ? "/login" : "/login"}
            >
              {isLogin ? "Register" : isRegister ? "Log in" : "Back to login"}
            </Link>
          </p>
        </Tilt>
      </div>
    </main>
  );
}
