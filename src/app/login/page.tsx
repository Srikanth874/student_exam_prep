import { AuthCard } from "@/components/AuthCard";

export const metadata = {
  title: "Login | EduForge AI",
  description: "Sign in to EduForge AI and access your learning workspace."
};

export default function LoginPage() {
  return <AuthCard mode="login" />;
}
