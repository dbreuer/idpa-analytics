import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "Overall Performance Score",
    description:
      "Placement points, participation, win bonuses, podium bonuses, and consistency are combined using a configurable scoring model. Participation is capped so it cannot dominate performance by itself.",
  },
  {
    title: "Speed Metrics",
    description:
      "Raw times are displayed when present, but cross-competition comparisons are labeled carefully. The dashboard also computes normalized speed scores using each competition's fastest valid time as the baseline.",
  },
  {
    title: "Club Rankings",
    description:
      "Club Power uses the capped sum of top member scores, while Club Strength uses average member output. This prevents very large clubs from winning only through volume.",
  },
  {
    title: "Rising Star",
    description:
      "The dashboard compares the first half and second half of an eligible competitor's season by average placement. The best positive improvement becomes the rising star when at least three competitions exist.",
  },
  {
    title: "Source Data and Transparency",
    description:
      "The source of truth is the official MDLSZ competition calendar and official competition result PDFs. Raw and normalized values are preserved, missing data is shown as N/A, and parsing failures are surfaced in the quality dashboard.",
  },
];

export default function MethodologyPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#111827_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Badge>Methodology</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">Transparent analytics methodology</h1>
          <p className="mt-3 text-slate-300">Every major metric is documented so the season story remains traceable to official source data.</p>
        </div>
        {sections.map((section) => (
          <Card key={section.title}>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription className="mt-3 text-base leading-7">{section.description}</CardDescription>
          </Card>
        ))}
      </div>
    </main>
  );
}
