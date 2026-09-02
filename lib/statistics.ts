import { normalizeClubName } from "@/lib/normalization";
import { defaultScoringConfig, overallScore } from "@/lib/scoring";
import type {
  ClubStanding,
  Competition,
  CompetitionResult,
  CompetitionStanding,
  CompetitorStanding,
  DivisionStanding,
  SeasonInsights,
  StatisticsSnapshot,
} from "@/lib/types";
import { average, median, standardDeviation } from "@/lib/utils";

interface BuildOptions {
  clubAliases?: Record<string, string>;
  minimumConsistencyCompetitions?: number;
}

export function buildStatistics(
  competitions: Competition[],
  results: CompetitionResult[],
  options: BuildOptions = {},
): StatisticsSnapshot {
  const clubAliases = options.clubAliases ?? {};
  const minimumConsistencyCompetitions = options.minimumConsistencyCompetitions ?? 3;
  const competitionsById = new Map(competitions.map((competition) => [competition.id, competition]));

  const normalizedResults = results.map((result) => ({
    ...result,
    normalizedClub: normalizeClubName(result.normalizedClub ?? result.club, clubAliases) ?? result.normalizedClub,
  }));

  const fastestByCompetition = new Map<string, number>();
  for (const result of normalizedResults) {
    if (result.timeSeconds === undefined) continue;
    const current = fastestByCompetition.get(result.competitionId);
    if (current === undefined || result.timeSeconds < current) {
      fastestByCompetition.set(result.competitionId, result.timeSeconds);
    }
  }

  const competitorMap = new Map<string, CompetitorStanding>();
  for (const result of normalizedResults) {
    const key = result.normalizedCompetitorName || result.competitorName;
    const existing = competitorMap.get(key) ?? {
      competitorName: result.competitorName,
      normalizedCompetitorName: key,
      club: result.normalizedClub ?? result.club,
      divisionSet: [],
      entries: 0,
      uniqueCompetitions: 0,
      wins: 0,
      podiums: 0,
      averagePlacement: null,
      medianPlacement: null,
      placementStdDev: 0,
      top10Rate: 0,
      podiumRate: 0,
      fastestTime: null,
      averageTime: null,
      normalizedSpeedScore: null,
      overallScore: 0,
      consistencyScore: 0,
      placements: [],
      competitionIds: [],
      placementsByDate: [],
    } satisfies CompetitorStanding;

    existing.entries += 1;
    if (!existing.competitionIds.includes(result.competitionId)) {
      existing.competitionIds.push(result.competitionId);
    }
    if (result.division && !existing.divisionSet.includes(result.division)) {
      existing.divisionSet.push(result.division);
    }
    if (!existing.club && (result.normalizedClub ?? result.club)) {
      existing.club = result.normalizedClub ?? result.club;
    }
    if (result.placement) {
      existing.placements.push(result.placement);
      if (result.placement === 1) existing.wins += 1;
      if (result.placement <= 3) existing.podiums += 1;
    }
    if (result.timeSeconds !== undefined) {
      existing.fastestTime = existing.fastestTime === null
        ? result.timeSeconds
        : Math.min(existing.fastestTime, result.timeSeconds);
    }

    const competitionFastest = fastestByCompetition.get(result.competitionId);
    if (result.timeSeconds !== undefined && competitionFastest) {
      const score = competitionFastest / result.timeSeconds;
      existing.normalizedSpeedScore = (existing.normalizedSpeedScore ?? 0) + score;
    }

    existing.placementsByDate.push({
      date: result.competitionDate,
      placement: result.placement,
      competitionName: result.competitionName,
      overallScore: result.placement ? overallScore([result.placement], 1, defaultScoringConfig) : 0,
    });

    competitorMap.set(key, existing);
  }

  const competitors = Array.from(competitorMap.values()).map((competitor) => {
    const times = normalizedResults
      .filter((result) => result.normalizedCompetitorName === competitor.normalizedCompetitorName)
      .map((result) => result.timeSeconds)
      .filter((value): value is number => value !== undefined);

    competitor.uniqueCompetitions = competitor.competitionIds.length;
    competitor.averagePlacement = average(competitor.placements);
    competitor.medianPlacement = median(competitor.placements);
    competitor.placementStdDev = standardDeviation(competitor.placements);
    competitor.top10Rate = competitor.placements.length
      ? competitor.placements.filter((placement) => placement <= 10).length / competitor.placements.length
      : 0;
    competitor.podiumRate = competitor.placements.length
      ? competitor.podiums / competitor.placements.length
      : 0;
    competitor.averageTime = average(times);
    competitor.normalizedSpeedScore = competitor.entries
      ? (competitor.normalizedSpeedScore ?? 0) / competitor.entries
      : null;
    competitor.overallScore = Number(
      overallScore(competitor.placements, competitor.uniqueCompetitions, defaultScoringConfig).toFixed(2),
    );
    competitor.consistencyScore = Number(
      ((competitor.top10Rate * 35) + (competitor.podiumRate * 25) + Math.max(0, 40 - competitor.placementStdDev * 10)).toFixed(2),
    );
    competitor.placementsByDate.sort((a, b) => a.date.localeCompare(b.date));

    return competitor;
  }).sort((a, b) => b.overallScore - a.overallScore);

  const clubMap = new Map<string, ClubStanding>();
  for (const competitor of competitors) {
    const clubName = competitor.club;
    if (!clubName) continue;

    const existing = clubMap.get(clubName) ?? {
      club: clubName,
      members: 0,
      appearances: 0,
      wins: 0,
      podiums: 0,
      averagePlacement: null,
      powerScore: 0,
      strengthScore: 0,
      topCompetitor: undefined,
      bestDivision: undefined,
    };

    existing.members += 1;
    existing.appearances += competitor.entries;
    existing.wins += competitor.wins;
    existing.podiums += competitor.podiums;
    existing.powerScore += competitor.overallScore;
    if (!existing.topCompetitor || competitor.overallScore > (competitors.find((entry) => entry.competitorName === existing.topCompetitor)?.overallScore ?? -1)) {
      existing.topCompetitor = competitor.competitorName;
    }
    existing.bestDivision = competitor.divisionSet[0] ?? existing.bestDivision;
    clubMap.set(clubName, existing);
  }

  const clubsRanking = Array.from(clubMap.values()).map((club) => {
    const members = competitors.filter((competitor) => competitor.club === club.club);
    const placements = members.flatMap((competitor) => competitor.placements);
    const topMemberScores = members.map((member) => member.overallScore).sort((a, b) => b - a).slice(0, 5);
    club.averagePlacement = average(placements);
    club.powerScore = Number(topMemberScores.reduce((sum, value) => sum + value, 0).toFixed(2));
    club.strengthScore = Number(((average(members.map((member) => member.overallScore)) ?? 0)).toFixed(2));
    return club;
  }).sort((a, b) => b.powerScore - a.powerScore);

  const divisionsMap = new Map<string, DivisionStanding>();
  for (const result of normalizedResults) {
    if (!result.division) continue;
    const existing = divisionsMap.get(result.division) ?? {
      division: result.division,
      competitors: 0,
      appearances: 0,
      fastestTime: null,
      mostSuccessfulCompetitor: undefined,
      mostActiveCompetitor: undefined,
      mostSuccessfulClub: undefined,
    };
    existing.appearances += 1;
    if (result.timeSeconds !== undefined) {
      existing.fastestTime = existing.fastestTime === null
        ? result.timeSeconds
        : Math.min(existing.fastestTime, result.timeSeconds);
    }
    divisionsMap.set(result.division, existing);
  }

  const divisions = Array.from(divisionsMap.values()).map((division) => {
    const divisionResults = normalizedResults.filter((result) => result.division === division.division);
    division.competitors = new Set(divisionResults.map((result) => result.normalizedCompetitorName)).size;
    const divisionCompetitors = competitors.filter((competitor) => competitor.divisionSet.includes(division.division));
    division.mostSuccessfulCompetitor = divisionCompetitors.sort((a, b) => b.overallScore - a.overallScore)[0]?.competitorName;
    division.mostActiveCompetitor = divisionCompetitors.sort((a, b) => b.uniqueCompetitions - a.uniqueCompetitions)[0]?.competitorName;
    const clubs = clubsRanking.filter((club) =>
      normalizedResults.some((result) => result.division === division.division && (result.normalizedClub ?? result.club) === club.club),
    );
    division.mostSuccessfulClub = clubs.sort((a, b) => b.powerScore - a.powerScore)[0]?.club;
    return division;
  }).sort((a, b) => b.appearances - a.appearances);

  const competitionsStats: CompetitionStanding[] = competitions.map((competition) => {
    const competitionResults = normalizedResults.filter((result) => result.competitionId === competition.id);
    const placements = competitionResults.map((result) => result.placement).filter((value): value is number => value !== undefined);
    return {
      competitionId: competition.id,
      competitionName: competition.name,
      competitionDate: competition.date,
      location: competition.location,
      competitorCount: new Set(competitionResults.map((result) => result.normalizedCompetitorName)).size,
      teamCount: new Set(competitionResults.map((result) => result.normalizedTeam).filter(Boolean)).size,
      divisionCount: new Set(competitionResults.map((result) => result.division).filter(Boolean)).size,
      fastestTime: competitionResults.map((result) => result.timeSeconds).filter((value): value is number => value !== undefined).sort((a, b) => a - b)[0] ?? null,
      winner: competitionResults.find((result) => result.placement === 1)?.competitorName,
      averagePlacement: average(placements),
      sourceUrl: competition.sourceUrl,
      resultPdfUrl: competition.resultPdfUrl,
    };
  }).sort((a, b) => a.competitionDate.localeCompare(b.competitionDate));

  const overallTop5 = competitors.slice(0, 5);
  const speedTop5 = [...competitors]
    .filter((competitor) => competitor.fastestTime !== null || competitor.normalizedSpeedScore !== null)
    .sort((a, b) => (b.normalizedSpeedScore ?? 0) - (a.normalizedSpeedScore ?? 0))
    .slice(0, 5);
  const ironmanTop5 = [...competitors]
    .sort((a, b) => b.uniqueCompetitions - a.uniqueCompetitions || b.overallScore - a.overallScore)
    .slice(0, 5);
  const consistencyTop5 = [...competitors]
    .filter((competitor) => competitor.uniqueCompetitions >= minimumConsistencyCompetitions)
    .sort((a, b) => b.consistencyScore - a.consistencyScore)
    .slice(0, 5);

  const insights: SeasonInsights = {
    dominator: overallTop5[0]?.competitorName,
    speedDemon: speedTop5[0]?.competitorName,
    ironman: ironmanTop5[0]?.competitorName,
    mrConsistent: consistencyTop5[0]?.competitorName,
    risingStar: risingStar(competitors),
    biggestCompetition: [...competitionsStats].sort((a, b) => b.competitorCount - a.competitorCount)[0]?.competitionName,
    strongestClub: clubsRanking[0]?.club,
    podiumMachine: [...competitors].sort((a, b) => b.podiumRate - a.podiumRate)[0]?.competitorName,
  };

  return {
    totalCompetitions: competitions.length,
    uniqueCompetitors: competitors.length,
    clubs: clubsRanking.length,
    totalEntries: normalizedResults.length,
    fastestRecordedTime: normalizedResults.map((result) => result.timeSeconds).filter((value): value is number => value !== undefined).sort((a, b) => a - b)[0] ?? null,
    mostActiveCompetitor: ironmanTop5[0]?.competitorName,
    competitors,
    overallTop5,
    speedTop5,
    ironmanTop5,
    consistencyTop5,
    clubsRanking,
    divisions,
    competitions: competitionsStats,
    insights,
  };
}

function risingStar(competitors: CompetitorStanding[]) {
  const eligible = competitors
    .map((competitor) => {
      if (competitor.placementsByDate.length < 3) {
        return null;
      }
      const midpoint = Math.floor(competitor.placementsByDate.length / 2);
      const first = competitor.placementsByDate.slice(0, midpoint).map((item) => item.placement).filter((value): value is number => value !== undefined);
      const second = competitor.placementsByDate.slice(midpoint).map((item) => item.placement).filter((value): value is number => value !== undefined);
      const firstAverage = average(first);
      const secondAverage = average(second);
      if (firstAverage === null || secondAverage === null) {
        return null;
      }
      return {
        competitor: competitor.competitorName,
        improvement: firstAverage - secondAverage,
      };
    })
    .filter((value): value is { competitor: string; improvement: number } => Boolean(value))
    .sort((a, b) => b.improvement - a.improvement);

  return eligible[0]?.competitor;
}
