import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ni-bg" />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
