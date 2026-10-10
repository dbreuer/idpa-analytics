"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { CompetitorStanding } from "@/lib/types";
import { formatNullableNumber, formatNumber } from "@/lib/utils";

interface TopCompetitorsProps {
  year: number;
  competitors: CompetitorStanding[];
  onSelect: (competitor: CompetitorStanding) => void;
}

export function TopCompetitors({ year, competitors, onSelect }: TopCompetitorsProps) {
  const maxScore = Math.max(competitors[0]?.overallScore ?? 0, 1);

  return (
    <Card className="competitor-panel">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <CardTitle className="font-display text-3xl">Élen álló versenyzők</CardTitle>
          <CardDescription className="mt-1">Magyarországi IDPA-versenyek · {year}</CardDescription>
        </div>
        <p className="hidden text-right text-xs text-[var(--ink-muted)] sm:block">Összesített<br />teljesítmény</p>
      </div>
      {competitors.length ? (
        <ol className="m-0 list-none p-0">
          {competitors.map((competitor, index) => (
            <li key={competitor.normalizedCompetitorName}>
              <button
                type="button"
                onClick={() => onSelect(competitor)}
                aria-label={`${competitor.competitorName} adatlapja: ${formatNumber(competitor.overallScore, 0)} teljesítménypont`}
                className="competitor-row editorial-row w-full p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`rank-number ${index < 3 ? "rank-number-podium" : ""}`}>{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--ink)]">{competitor.competitorName}</p>
                      <p className="mt-0.5 truncate text-sm text-[var(--ink-muted)]">{competitor.club ?? "Nincs egyesületi adat"}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-2xl font-bold leading-none tabular-nums">{formatNumber(competitor.overallScore, 0)}</p>
                    <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">Pontszám</p>
                  </div>
                </div>
                <span className="score-track mt-3 block" aria-hidden="true">
                  <span style={{ width: `${Math.min((competitor.overallScore / maxScore) * 100, 100)}%` }} />
                </span>
                <span className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)] sm:grid-cols-4">
                  <span>Győzelmek <strong className="text-[var(--ink)]">{competitor.wins}</strong></span>
                  <span>Dobogók <strong className="text-[var(--ink)]">{competitor.podiums}</strong></span>
                  <span>Versenyek <strong className="text-[var(--ink)]">{competitor.uniqueCompetitions}</strong></span>
                  <span>Legjobb idő <strong className="text-[var(--ink)]">{formatNullableNumber(competitor.fastestTime, 2)}</strong></span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-y border-[var(--rule)] py-8 text-sm text-[var(--ink-muted)]" role="status">
          A megadott szűrőknek egyetlen versenyző sem felel meg. A szezonrangsor megjelenítéséhez módosítsa a fenti szűrőket.
        </p>
      )}
    </Card>
  );
}
