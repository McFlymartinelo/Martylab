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

export interface MatchdayMatch extends MatchdayUpcomingMatch {
  status: string;
  predictionHome: number | null;
  predictionAway: number | null;
  actualHome: number | null;
  actualAway: number | null;
}

export interface MatchdayChatMessage {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

export type MatchdayNotificationSeverity = "info" | "warning";

export interface MatchdayNotification {
  id: string;
  severity: MatchdayNotificationSeverity;
  title: string;
  message: string;
  at: string;
}

export interface MatchdayNotificationsResponse {
  available: boolean;
  items: MatchdayNotification[];
}

export interface MatchdayPageResponse {
  available: boolean;
  groupId: number | null;
  groupName: string | null;
  matchdayUrl: string | null;
  personalized: boolean;
  userRank: number | null;
  userTotalPoints: number | null;
  pendingPredictions: number | null;
  todayMatches: MatchdayMatch[];
  upcomingMatches: MatchdayMatch[];
  standings: MatchdayStandingEntry[];
  recentMessages: MatchdayChatMessage[];
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
