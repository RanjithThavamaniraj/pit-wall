import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = {
  title: "Founder Dashboard",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-root min-h-screen bg-[#07090f] text-slate-100">
      {children}
    </div>
  );
}
