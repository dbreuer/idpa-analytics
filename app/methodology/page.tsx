import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Overall performance score",
    description:
      "Placement points, participation, win bonuses, podium bonuses, and consistency are combined using a configurable scoring model. Participation is capped so it cannot dominate performance by itself.",
  },
  {
    title: "Speed metrics",
    description:
      "Raw times are displayed when present, but cross-competition comparisons are labeled carefully. The dashboard also computes normalized speed scores using each competition's fastest valid time as the baseline.",
  },
  {
    title: "Club rankings",
    description:
      "Club Power uses the capped sum of top member scores, while Club Strength uses average member output. This prevents very large clubs from winning only through volume.",
  },
  {
    title: "Rising star",
    description:
      "The dashboard compares the first half and second half of an eligible competitor's season by average placement. The best positive improvement becomes the rising star when at least three competitions exist.",
  },
  {
    title: "Source data and transparency",
    description:
      "The source of truth is the official MDLSZ competition calendar and official competition result PDFs. Raw and normalized values are preserved, missing data is shown as N/A, and parsing failures are surfaced in the quality dashboard.",
  },
];

export default function MethodologyPage() {
  return (
    <>
      <header className="methodology-nav">
        <div className="methodology-nav-inner">
          <Link href="/" className="brand-mark" aria-label="Hero of IDPA home">
            <span className="brand-mark-top">HERO OF</span>
            <span className="brand-mark-bottom">IDPA<span className="brand-period">.</span></span>
          </Link>
          <Link href="/" className="source-link">Back to season overview</Link>
        </div>
      </header>
      <main className="methodology-main">
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] md:text-6xl">
          Transparent analytics methodology
        </h1>
        <p className="mt-4 max-w-[68ch] text-base leading-7 text-[var(--ink-muted)]">
          Every major metric is documented so each season’s story stays traceable to its official sources.
        </p>
        <div className="mt-10 space-y-7">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardTitle className="font-display text-2xl font-bold">{section.title}</CardTitle>
              <CardDescription className="mt-2 max-w-[68ch] text-base leading-7">
                {section.description}
              </CardDescription>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
