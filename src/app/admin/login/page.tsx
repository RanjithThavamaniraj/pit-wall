import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="admin-login-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
        PitWall Apex
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
        Founder sign in
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Password-protected access to usage and traffic monitoring.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
