"use client";

import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardForm } from "@/components/DashboardForm";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  return (
    <ProtectedRoute>
      <div className="h-screen w-screen overflow-hidden">
        <DashboardForm user={user} onLogout={handleLogout} />
      </div>
    </ProtectedRoute>
  );
}