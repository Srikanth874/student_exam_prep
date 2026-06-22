"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-midnight text-slate-100">
        <div className="glass-panel flex items-center gap-3 rounded-lg px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-aurora" />
          <span>Checking your session</span>
        </div>
      </main>
    );
  }

  return children;
}
