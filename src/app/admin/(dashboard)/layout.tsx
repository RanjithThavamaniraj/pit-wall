import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export default function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className="border-b border-white/10 bg-[#07090f]/90 backdrop-blur-xl">
        <div className="layout-shell flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="font-[family-name:var(--font-rajdhani)] text-lg font-bold uppercase tracking-[0.2em] text-white"
            >
              PitWall <span className="text-amber-300">Admin</span>
            </Link>
            <span className="hidden text-xs uppercase tracking-[0.24em] text-slate-500 sm:inline">
              Founder dashboard
            </span>
          </div>
          <AdminLogoutButton />
        </div>
      </header>
      <div className="layout-shell py-8 sm:py-10">{children}</div>
    </>
  );
}
