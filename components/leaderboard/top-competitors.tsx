"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type { CompetitorStanding } from "@/lib/types";
import { formatNullableNumber, formatNumber } from "@/lib/utils";

const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

interface TopCompetitorsProps {
  year: number;
  competitors: CompetitorStanding[];
  onSelect: (competitor: CompetitorStanding) => void;
}

export function TopCompetitors({ year, competitors, onSelect }: TopCompetitorsProps) {
  const maxScore = competitors[0]?.overallScore ?? 1;

  return (
    <Card className="overflow-hidden">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Badge>Top 5 Competitors</Badge>
          <CardTitle className="mt-3 text-3xl">IDPA Hungary {year}</CardTitle>
          <CardDescription>Configurable overall performance score with wins, podiums, participation, and consistency.</CardDescription>
        </div>
        <div className="hidden rounded-full border border-amber-300/30 bg-amber-300/10 p-4 text-amber-100 md:block">
          <Trophy className="h-6 w-6" />
        </div>
      </div>
      <div className="space-y-4">
        {competitors.map((competitor, index) => (
          <button
            key={competitor.normalizedCompetitorName}
            type="button"
            onClick={() => onSelect(competitor)}
            className="w-full text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-3xl border border-white/8 bg-slate-950/70 p-4 transition hover:border-cyan-300/30"
            >
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medals[index] ?? `${index + 1}.`}</span>
                  <div>
                    <p className="text-lg font-semibold text-white">{competitor.competitorName}</p>
                    <p className="text-sm text-slate-400">{competitor.club ?? "No club data"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Performance Points</p>
                  <p className="text-xl font-semibold text-white">{formatNumber(competitor.overallScore, 0)}</p>
                </div>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-orange-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(competitor.overallScore / maxScore) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
              <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-4">
                <span>Wins: {competitor.wins}</span>
                <span>Podiums: {competitor.podiums}</span>
                <span>Appearances: {competitor.uniqueCompetitions}</span>
                <span>Fastest: {formatNullableNumber(competitor.fastestTime, 2)}</span>
              </div>
            </motion.div>
          </button>
        ))}
      </div>
    </Card>
  );
}
