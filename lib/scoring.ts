import { average, standardDeviation } from "@/lib/utils";
import type { ScoringBreakdown } from "@/lib/types";

export interface ScoringConfig {
  placementPoints: Record<number, number>;
  winBonus: number;
  secondBonus: number;
  thirdBonus: number;
  participationWeight: number;
  consistencyWeight: number;
}

export const defaultScoringConfig: ScoringConfig = {
  placementPoints: {
    1: 100,
    2: 80,
    3: 65,
    4: 50,
    5: 40,
    6: 35,
    7: 30,
    8: 26,
    9: 22,
    10: 18,
  },
  winBonus: 16,
  secondBonus: 8,
  thirdBonus: 5,
  participationWeight: 10,
  consistencyWeight: 40,
};

export function placementScore(placement?: number, config = defaultScoringConfig) {
  if (!placement) {
    return 0;
  }

  if (config.placementPoints[placement]) {
    return config.placementPoints[placement];
  }

  if (placement <= 20) {
    return Math.max(0, 18 - (placement - 10) * 1.5);
  }

  return 0;
}

export function buildScoringBreakdown(
  placements: number[],
  uniqueCompetitions: number,
  config = defaultScoringConfig,
): ScoringBreakdown {
  const placementComponent = placements.reduce(
    (sum, placement) => sum + placementScore(placement, config),
    0,
  );
  const wins = placements.filter((placement) => placement === 1).length;
  const seconds = placements.filter((placement) => placement === 2).length;
  const thirds = placements.filter((placement) => placement === 3).length;
  const podiums = wins + seconds + thirds;
  const placementAverage = average(placements) ?? 999;
  const consistencySignal = Math.max(0, 1 - Math.min(standardDeviation(placements) / 10, 1));
  const placementSignal = Math.max(0, 1 - Math.min((placementAverage - 1) / 15, 1));

  return {
    placementScore: placementComponent,
    participationScore: Math.min(uniqueCompetitions * config.participationWeight, 45),
    winScore: wins * config.winBonus,
    podiumScore: seconds * config.secondBonus + thirds * config.thirdBonus + Math.max(0, podiums - wins - seconds - thirds),
    consistencyScore: Number(
      (config.consistencyWeight * ((consistencySignal * 0.55) + (placementSignal * 0.45))).toFixed(2),
    ),
  };
}

export function overallScore(
  placements: number[],
  uniqueCompetitions: number,
  config = defaultScoringConfig,
) {
  const breakdown = buildScoringBreakdown(placements, uniqueCompetitions, config);
  return Object.values(breakdown).reduce((sum, value) => sum + value, 0);
}
