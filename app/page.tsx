import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { loadDashboardData } from "@/lib/data";

export default function Home() {
  const data = loadDashboardData();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#020617_35%,#111827_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardApp {...data} />
      </div>
    </main>
  );
}
