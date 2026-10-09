import { ExternalLink } from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { CompetitionStanding } from "@/lib/types";
import { formatDate, formatNullableNumber } from "@/lib/utils";

interface CompetitionTimelineProps {
  year: number;
  competitions: CompetitionStanding[];
}

export function CompetitionTimeline({ year, competitions }: CompetitionTimelineProps) {
  return (
    <Card>
      <CardTitle>Competition Timeline</CardTitle>
      <CardDescription className="mb-6">Every discovered {year} IDPA competition with source transparency.</CardDescription>
      <div className="space-y-4">
        {competitions.map((competition) => (
          <div key={competition.competitionId} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{formatDate(competition.competitionDate)}</p>
                <h3 className="mt-1 text-lg font-semibold text-white">{competition.competitionName}</h3>
                <p className="text-sm text-slate-400">{competition.location ?? "Location N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300 md:grid-cols-4">
                <span>Competitors: {competition.competitorCount}</span>
                <span>Divisions: {competition.divisionCount}</span>
                <span>Winner: {competition.winner ?? "N/A"}</span>
                <span>Fastest: {formatNullableNumber(competition.fastestTime, 2)}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-cyan-100">
              <a href={competition.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                View Competition Source <ExternalLink className="h-4 w-4" />
              </a>
              {competition.resultPdfUrl ? (
                <a href={competition.resultPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                  View Official Result <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <span className="text-slate-500">Official result PDF not discovered yet.</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
