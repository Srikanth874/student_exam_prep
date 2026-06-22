import { AuthCard } from "@/components/AuthCard";

export const metadata = {
  title: "Forgot Password | EduForge AI",
  description: "Reset your password and regain access to EduForge AI."
};

export default function ForgotPasswordPage() {
  return <AuthCard mode="forgot-password" />;
}
