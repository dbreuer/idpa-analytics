export interface Competition {
  id: string;
  name: string;
  date: string;
  location?: string;
  sourceUrl: string;
  resultPdfUrl?: string;
  resultPdfPath?: string;
  discipline?: string;
  level?: string;
  organizer?: string;
  code?: string;
  downloadStatus?: "downloaded" | "missing" | "failed" | "pending";
  downloadError?: string;
}

export interface CompetitionDiscoveryFile {
  generatedAt: string | null;
  sourceUrl: string;
  discoveredCount: number;
  competitions: Competition[];
  errors: string[];
}

export interface ParsedNotes {
  competitionLicenseId?: string;
  timeSeconds?: number;
  rawNotes?: string;
  parseError?: boolean;
}

export interface CompetitorIdentity {
  displayName: string;
  normalizedName: string;
}

export interface CompetitionResult extends ParsedNotes {
  competitionId: string;
  competitionName: string;
  competitionDate: string;
  placement?: number;
  competitorName: string;
  normalizedCompetitorName: string;
  competitorIdentity: CompetitorIdentity;
  team?: string;
  normalizedTeam?: string;
  club?: string;
  normalizedClub?: string;
  division?: string;
  category?: string;
  rawResult?: string;
  rawPlacement?: string;
  rawClubTeam?: string;
  rawRow?: Record<string, string>;
}

export interface ResultsFile {
  generatedAt: string | null;
  results: CompetitionResult[];
  parsingErrors: Array<Record<string, unknown>>;
  ambiguousCompetitors: Array<Record<string, unknown>>;
}

export interface DataQuality {
  totalPdfsDiscovered: number;
  successfullyProcessedPdfs: number;
  failedPdfs: number;
  totalExtractedRows: number;
  validCompetitorRows: number;
  rowsWithValidTime: number;
  rowsWithMissingTeam: number;
  rowsWithParsingErrors: number;
}

export interface QualityFile {
  generatedAt: string | null;
  quality: DataQuality;
  errors: string[];
}

export interface CompetitorStanding {
  competitorName: string;
  normalizedCompetitorName: string;
  club?: string;
  divisionSet: string[];
  entries: number;
  uniqueCompetitions: number;
  wins: number;
  podiums: number;
  averagePlacement?: number | null;
  medianPlacement?: number | null;
  placementStdDev: number;
  top10Rate: number;
  podiumRate: number;
  fastestTime?: number | null;
  averageTime?: number | null;
  normalizedSpeedScore?: number | null;
  overallScore: number;
  consistencyScore: number;
  placements: number[];
  competitionIds: string[];
  placementsByDate: Array<{ date: string; placement?: number; competitionName: string; overallScore: number }>;
}

export interface ClubStanding {
  club: string;
  members: number;
  appearances: number;
  wins: number;
  podiums: number;
  averagePlacement?: number | null;
  powerScore: number;
  strengthScore: number;
  topCompetitor?: string;
  bestDivision?: string;
}

export interface DivisionStanding {
  division: string;
  competitors: number;
  appearances: number;
  fastestTime?: number | null;
  mostSuccessfulCompetitor?: string;
  mostActiveCompetitor?: string;
  mostSuccessfulClub?: string;
}

export interface CompetitionStanding {
  competitionId: string;
  competitionName: string;
  competitionDate: string;
  location?: string;
  competitorCount: number;
  teamCount: number;
  divisionCount: number;
  fastestTime?: number | null;
  winner?: string;
  averagePlacement?: number | null;
  sourceUrl: string;
  resultPdfUrl?: string;
}

export interface SeasonInsights {
  dominator?: string;
  speedDemon?: string;
  ironman?: string;
  mrConsistent?: string;
  risingStar?: string;
  biggestCompetition?: string;
  strongestClub?: string;
  podiumMachine?: string;
}

export interface ScoringBreakdown {
  placementScore: number;
  participationScore: number;
  winScore: number;
  podiumScore: number;
  consistencyScore: number;
}

export interface StatisticsSnapshot {
  totalCompetitions: number;
  uniqueCompetitors: number;
  clubs: number;
  totalEntries: number;
  fastestRecordedTime?: number | null;
  mostActiveCompetitor?: string;
  competitors: CompetitorStanding[];
  overallTop5: CompetitorStanding[];
  speedTop5: CompetitorStanding[];
  ironmanTop5: CompetitorStanding[];
  consistencyTop5: CompetitorStanding[];
  clubsRanking: ClubStanding[];
  divisions: DivisionStanding[];
  competitions: CompetitionStanding[];
  insights: SeasonInsights;
}

export interface StatisticsFile {
  generatedAt: string | null;
  statistics: StatisticsSnapshot | null;
  errors: string[];
}
