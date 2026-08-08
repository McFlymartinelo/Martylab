import type {
  MatchdayChatMessage,
  MatchdayMatch,
  MatchdayNotification,
  MatchdayNotificationsResponse,
  MatchdayPageResponse,
  MatchdayStandingEntry,
  MatchdayStatusResponse,
  MatchdaySummaryResponse,
  MatchdayUpcomingMatch,
} from "@martylab/shared";

export interface MatchdayClientConfig {
  baseUrl?: string | undefined;
  publicUrl?: string | undefined;
  groupId?: number | undefined;
  serviceUsername?: string | undefined;
  servicePassword?: string | undefined;
  userPasswordsJson?: string | undefined;
  timeoutMs?: number | undefined;
}

interface MatchdayHealthPayload {
  status?: string;
  upcomingMatches?: number;
  matchCount?: number;
}

interface MatchdayLoginPayload {
  token: string;
  user: {
    id: number;
    username: string;
    displayName: string;
  };
}

interface MatchdayStandingRow {
  rank: number;
  userId: number;
  displayName: string;
  totalPoints: number;
}

interface MatchdayMatchRow {
  id: number;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  comp_nom?: string;
  status?: string;
  home_score?: number | null;
  away_score?: number | null;
  prediction?: { home_score: number; away_score: number } | null;
  isLocked?: boolean;
}

interface MatchdayGroupPayload {
  id: number;
  name: string;
  members?: Array<{ id: number; display_name: string }>;
}

interface MatchdayChatRow {
  id: number;
  content: string;
  created_at: string;
  display_name: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function isTodayInParis(iso: string): boolean {
  const formatter = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const today = formatter.format(new Date());
  const matchDay = formatter.format(new Date(iso));
  return today === matchDay;
}

function mapMatchRow(match: MatchdayMatchRow): MatchdayMatch {
  return {
    id: match.id,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    kickoffAt: match.kickoff_at,
    competitionName: match.comp_nom ?? "Compétition",
    hasPrediction: match.prediction !== null && match.prediction !== undefined,
    isLocked: Boolean(match.isLocked),
    status: match.status ?? "scheduled",
    predictionHome: match.prediction?.home_score ?? null,
    predictionAway: match.prediction?.away_score ?? null,
    actualHome:
      typeof match.home_score === "number" ? match.home_score : null,
    actualAway:
      typeof match.away_score === "number" ? match.away_score : null,
  };
}

function mapUpcomingMatch(match: MatchdayMatch): MatchdayUpcomingMatch {
  return {
    id: match.id,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    kickoffAt: match.kickoffAt,
    competitionName: match.competitionName,
    hasPrediction: match.hasPrediction,
    isLocked: match.isLocked,
  };
}

function parseUserPasswords(
  raw: string | undefined,
): Record<string, string> | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined;
    }

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.length > 0) {
        result[key.toLowerCase()] = value;
      }
    }
    return result;
  } catch {
    return undefined;
  }
}

export function createMatchdayClient(config: MatchdayClientConfig) {
  const baseUrl = config.baseUrl ? normalizeBaseUrl(config.baseUrl) : undefined;
  const publicUrl = config.publicUrl
    ? normalizeBaseUrl(config.publicUrl)
    : baseUrl;
  const timeoutMs = config.timeoutMs ?? 6_000;
  const userPasswords = parseUserPasswords(config.userPasswordsJson);

  const tokenCache = new Map<string, string>();

  async function request<T>(
    path: string,
    options: {
      method?: "GET" | "POST";
      body?: unknown;
      token?: string;
    } = {},
  ): Promise<T> {
    if (!baseUrl) {
      throw new Error("Matchday URL is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    try {
      const init: RequestInit = {
        method: options.method ?? "GET",
        headers,
        signal: controller.signal,
      };

      if (options.body !== undefined) {
        init.body = JSON.stringify(options.body);
      }

      const response = await fetch(`${baseUrl}${path}`, init);

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Matchday API error ${response.status}${text ? `: ${text}` : ""}`,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function login(username: string, password: string): Promise<string> {
    const cacheKey = username.toLowerCase();
    const cached = tokenCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const payload = await request<MatchdayLoginPayload>("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });

    tokenCache.set(cacheKey, payload.token);
    return payload.token;
  }

  async function getServiceToken(): Promise<string | null> {
    if (!config.serviceUsername || !config.servicePassword) {
      return null;
    }

    return login(config.serviceUsername, config.servicePassword);
  }

  async function resolveUserToken(
    martylabUsername: string,
  ): Promise<{ token: string; personalized: boolean } | null> {
    const normalized = martylabUsername.trim().toLowerCase();
    const userPassword = userPasswords?.[normalized];

    if (userPassword) {
      return {
        token: await login(normalized, userPassword),
        personalized: true,
      };
    }

    const serviceToken = await getServiceToken();
    if (!serviceToken) {
      return null;
    }

    return { token: serviceToken, personalized: false };
  }

  async function fetchGroupData(input: {
    martylabUsername: string;
    martylabDisplayName: string;
  }) {
    if (!baseUrl || !config.groupId) {
      return null;
    }

    const auth = await resolveUserToken(input.martylabUsername);
    if (!auth) {
      return null;
    }

    const groupId = config.groupId;
    const [group, standings, matches, chat] = await Promise.all([
      request<MatchdayGroupPayload>(`/api/groups/${groupId}`, {
        token: auth.token,
      }),
      request<MatchdayStandingRow[]>(`/api/groups/${groupId}/standings`, {
        token: auth.token,
      }),
      request<MatchdayMatchRow[]>(`/api/groups/${groupId}/matches`, {
        token: auth.token,
      }),
      request<MatchdayChatRow[]>(`/api/groups/${groupId}/chat`, {
        token: auth.token,
      }).catch(() => [] as MatchdayChatRow[]),
    ]);

    const normalizedUsername = input.martylabUsername.trim().toLowerCase();
    const normalizedDisplayName = input.martylabDisplayName
      .trim()
      .toLowerCase();

    const userRow =
      standings.find(
        (row) => row.displayName.trim().toLowerCase() === normalizedDisplayName,
      ) ??
      standings.find((row) =>
        row.displayName.trim().toLowerCase().includes(normalizedUsername),
      );

    const mappedMatches = matches.map(mapMatchRow);
    const pendingPredictions = auth.personalized
      ? mappedMatches.filter((match) => !match.isLocked && !match.hasPrediction)
          .length
      : null;

    const fullStandings: MatchdayStandingEntry[] = standings.map((row) => ({
      rank: row.rank,
      displayName: row.displayName,
      totalPoints: row.totalPoints,
    }));

    const recentMessages: MatchdayChatMessage[] = chat
      .slice(-5)
      .reverse()
      .map((message) => ({
        id: message.id,
        author: message.display_name,
        content: message.content,
        createdAt: message.created_at,
      }));

    return {
      auth,
      group,
      groupId,
      userRow,
      mappedMatches,
      pendingPredictions,
      fullStandings,
      recentMessages,
    };
  }

  return {
    isConfigured: Boolean(baseUrl && config.groupId),
    hasServiceCredentials: Boolean(
      config.serviceUsername && config.servicePassword,
    ),
    publicUrl: publicUrl ?? null,

    async checkHealth(): Promise<MatchdayStatusResponse> {
      if (!baseUrl) {
        return {
          configured: false,
          online: false,
          upcomingMatches: null,
          matchCount: null,
        };
      }

      try {
        const payload = await request<MatchdayHealthPayload>("/api/health");
        return {
          configured: true,
          online: payload.status === "ok",
          upcomingMatches:
            typeof payload.upcomingMatches === "number"
              ? payload.upcomingMatches
              : null,
          matchCount:
            typeof payload.matchCount === "number" ? payload.matchCount : null,
        };
      } catch {
        return {
          configured: true,
          online: false,
          upcomingMatches: null,
          matchCount: null,
        };
      }
    },

    async getSummary(input: {
      martylabUsername: string;
      martylabDisplayName: string;
    }): Promise<MatchdaySummaryResponse> {
      const empty: MatchdaySummaryResponse = {
        available: false,
        groupId: config.groupId ?? null,
        groupName: null,
        userRank: null,
        userTotalPoints: null,
        memberCount: null,
        pendingPredictions: null,
        personalized: false,
        topStandings: [],
        upcomingMatches: [],
        matchdayUrl: publicUrl ?? null,
      };

      if (!baseUrl || !config.groupId) {
        return empty;
      }

      try {
        const data = await fetchGroupData(input);
        if (!data) {
          return empty;
        }

        const upcomingMatches = data.mappedMatches
          .filter((match) => !match.isLocked)
          .slice(0, 5)
          .map(mapUpcomingMatch);

        return {
          available: true,
          groupId: data.groupId,
          groupName: data.group.name ?? null,
          userRank: data.userRow?.rank ?? null,
          userTotalPoints: data.userRow?.totalPoints ?? null,
          memberCount: data.fullStandings.length,
          pendingPredictions: data.pendingPredictions,
          personalized: data.auth.personalized,
          topStandings: data.fullStandings.slice(0, 5),
          upcomingMatches,
          matchdayUrl: publicUrl ?? null,
        };
      } catch {
        return { ...empty, available: false };
      }
    },

    async getPage(input: {
      martylabUsername: string;
      martylabDisplayName: string;
    }): Promise<MatchdayPageResponse> {
      const empty: MatchdayPageResponse = {
        available: false,
        groupId: config.groupId ?? null,
        groupName: null,
        matchdayUrl: publicUrl ?? null,
        personalized: false,
        userRank: null,
        userTotalPoints: null,
        pendingPredictions: null,
        todayMatches: [],
        upcomingMatches: [],
        standings: [],
        recentMessages: [],
      };

      if (!baseUrl || !config.groupId) {
        return empty;
      }

      try {
        const data = await fetchGroupData(input);
        if (!data) {
          return empty;
        }

        const todayMatches = data.mappedMatches.filter((match) =>
          isTodayInParis(match.kickoffAt),
        );
        const upcomingMatches = data.mappedMatches
          .filter((match) => !match.isLocked)
          .slice(0, 20);

        return {
          available: true,
          groupId: data.groupId,
          groupName: data.group.name ?? null,
          matchdayUrl: publicUrl ?? null,
          personalized: data.auth.personalized,
          userRank: data.userRow?.rank ?? null,
          userTotalPoints: data.userRow?.totalPoints ?? null,
          pendingPredictions: data.pendingPredictions,
          todayMatches,
          upcomingMatches,
          standings: data.fullStandings,
          recentMessages: data.recentMessages,
        };
      } catch {
        return empty;
      }
    },

    async getNotifications(input: {
      martylabUsername: string;
      martylabDisplayName: string;
    }): Promise<MatchdayNotificationsResponse> {
      const empty: MatchdayNotificationsResponse = {
        available: false,
        items: [],
      };

      if (!baseUrl || !config.groupId) {
        return empty;
      }

      try {
        const data = await fetchGroupData(input);
        if (!data) {
          return empty;
        }

        const now = new Date().toISOString();
        const items: MatchdayNotification[] = [];

        if (
          data.pendingPredictions !== null &&
          data.pendingPredictions > 0
        ) {
          items.push({
            id: "matchday-pending-predictions",
            severity: "warning",
            title: "Pronostics en attente",
            message: `${data.pendingPredictions} match(s) à pronostiquer.`,
            at: now,
          });
        }

        const todayCount = data.mappedMatches.filter((match) =>
          isTodayInParis(match.kickoffAt),
        ).length;

        if (todayCount > 0) {
          items.push({
            id: "matchday-today-matches",
            severity: "info",
            title: "Matchs du jour",
            message: `${todayCount} match(s) aujourd'hui dans la ligue.`,
            at: now,
          });
        }

        const startingSoon = data.mappedMatches.filter((match) => {
          if (match.isLocked || match.hasPrediction) {
            return false;
          }
          const diffMs = new Date(match.kickoffAt).getTime() - Date.now();
          return diffMs > 0 && diffMs <= 60 * 60 * 1000;
        });

        if (data.auth.personalized && startingSoon.length > 0) {
          items.push({
            id: "matchday-starting-soon",
            severity: "warning",
            title: "Coup d'envoi imminent",
            message: `${startingSoon.length} match(s) dans l'heure sans pronostic.`,
            at: now,
          });
        }

        return { available: true, items };
      } catch {
        return empty;
      }
    },
  };
}

export type MatchdayClient = ReturnType<typeof createMatchdayClient>;
