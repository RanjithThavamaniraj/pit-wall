import { FounderDashboard } from "@/components/admin/FounderDashboard";
import { getDashboardSummary } from "@/lib/analytics/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminDashboardPage() {
  const data = await getDashboardSummary(14);
  return <FounderDashboard data={data} />;
}
