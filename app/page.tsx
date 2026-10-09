import { redirect } from "next/navigation";
import { getAvailableYears } from "@/lib/data";

export const dynamic = "force-static";

export default function Home() {
  const [latestYear] = getAvailableYears();
  if (latestYear !== undefined) redirect(`/${latestYear}`);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#020617_35%,#111827_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-black text-white">Season data not generated yet</h1>
        <p className="mt-4 text-slate-300">
          Generate a season with <code>npm run pipeline:all -- --year 2026</code>, then rebuild the site.
        </p>
      </div>
    </main>
  );
}
