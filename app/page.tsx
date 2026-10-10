import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { getAvailableYears } from "@/lib/data";

export const dynamic = "force-static";

export default function Home() {
  const [latestYear] = getAvailableYears();
  if (latestYear !== undefined) redirect(`/${latestYear}`);

  return (
    <>
      <main className="empty-main min-h-screen">
        <div className="mx-auto max-w-4xl px-5 py-16">
          <h1 className="font-display text-5xl font-extrabold">Még nem állnak rendelkezésre szezonadatok</h1>
          <p className="mt-4 max-w-prose text-[var(--ink-muted)]">
            A szezonadatok előállításához futtassa a <code className="rounded border border-[var(--rule)] bg-[var(--paper)] px-1.5 py-1">npm run pipeline:all -- --year 2026</code> parancsot, majd készítse el újra a webhelyet.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
