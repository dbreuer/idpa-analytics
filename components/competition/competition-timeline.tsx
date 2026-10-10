import { ExternalLink } from "lucide-react";

import type { CompetitionStanding } from "@/lib/types";
import { formatDate, formatNullableNumber } from "@/lib/utils";

interface CompetitionTimelineProps {
  competitions: CompetitionStanding[];
}

export function CompetitionTimeline({ competitions }: CompetitionTimelineProps) {
  return competitions.length ? (
    <ol className="competition-list">
      {competitions.map((competition, index) => (
        <li key={competition.competitionId} className="competition-entry">
          <div className="competition-date">
            <span className="editorial-kicker">{String(index + 1).padStart(2, "0")}</span>
            <time dateTime={competition.competitionDate}>{formatDate(competition.competitionDate)}</time>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="competition-name">{competition.competitionName}</h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{competition.location ?? "Location unavailable"}</p>
            <dl className="competition-facts">
              <div><dt>Competitors</dt><dd>{competition.competitorCount}</dd></div>
              <div><dt>Divisions</dt><dd>{competition.divisionCount}</dd></div>
              <div><dt>Winner</dt><dd>{competition.winner ?? "N/A"}</dd></div>
              <div><dt>Fastest</dt><dd>{formatNullableNumber(competition.fastestTime, 2)}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a href={competition.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                Competition source <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
              {competition.resultPdfUrl ? (
                <a href={competition.resultPdfUrl} target="_blank" rel="noreferrer" className="source-link">
                  Official result <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-sm text-[var(--ink-muted)]">Official result PDF not found</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <p className="border-y border-[var(--rule)] py-10 text-sm text-[var(--ink-muted)]">
      No IDPA competitions were discovered for this season.
    </p>
  );
}
