import { AuthCard } from "@/components/AuthCard";

export const metadata = {
  title: "Register | EduForge AI",
  description: "Create your EduForge AI account and start generating educational assets."
};

export default function RegisterPage() {
  return <AuthCard mode="register" />;
}
