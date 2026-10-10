import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";

export default function NotFound() {
  return (
    <>
      <main className="empty-main min-h-screen">
        <div className="mx-auto max-w-4xl px-5 py-16">
          <h1 className="font-display text-5xl font-extrabold">Az oldal nem található</h1>
          <p className="mt-4 max-w-prose text-[var(--ink-muted)]">
            A kért oldal vagy szezon nem érhető el. A kezdőlapon a legfrissebb elérhető szezon adatai tekinthetők meg.
          </p>
          <Link href="/" className="source-link mt-6 inline-flex">Vissza a kezdőlapra</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
