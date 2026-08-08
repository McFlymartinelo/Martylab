export interface MatchdayStatusResponse {
  configured: boolean;
  online: boolean;
  upcomingMatches: number | null;
  matchCount: number | null;
}

export interface MatchdayStandingEntry {
  rank: number;
  displayName: string;
  totalPoints: number;
}

export interface MatchdayUpcomingMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  competitionName: string;
  hasPrediction: boolean;
  isLocked: boolean;
}

export interface MatchdaySummaryResponse {
  available: boolean;
  groupId: number | null;
  groupName: string | null;
  userRank: number | null;
  userTotalPoints: number | null;
  memberCount: number | null;
  pendingPredictions: number | null;
  personalized: boolean;
  topStandings: MatchdayStandingEntry[];
  upcomingMatches: MatchdayUpcomingMatch[];
  matchdayUrl: string | null;
}
