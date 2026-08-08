import type {
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
  prediction?: { home_score: number; away_score: number } | null;
  isLocked?: boolean;
}

interface MatchdayGroupPayload {
  id: number;
  name: string;
  members?: Array<{ id: number; display_name: string }>;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
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

      const auth = await resolveUserToken(input.martylabUsername);
      if (!auth) {
        return empty;
      }

      try {
        const groupId = config.groupId;
        const [group, standings, matches] = await Promise.all([
          request<MatchdayGroupPayload>(`/api/groups/${groupId}`, {
            token: auth.token,
          }),
          request<MatchdayStandingRow[]>(`/api/groups/${groupId}/standings`, {
            token: auth.token,
          }),
          request<MatchdayMatchRow[]>(`/api/groups/${groupId}/matches`, {
            token: auth.token,
          }),
        ]);

        const topStandings: MatchdayStandingEntry[] = standings
          .slice(0, 5)
          .map((row) => ({
            rank: row.rank,
            displayName: row.displayName,
            totalPoints: row.totalPoints,
          }));

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

        const upcomingMatches: MatchdayUpcomingMatch[] = matches
          .filter((match) => !match.isLocked)
          .slice(0, 5)
          .map((match) => ({
            id: match.id,
            homeTeam: match.home_team,
            awayTeam: match.away_team,
            kickoffAt: match.kickoff_at,
            competitionName: match.comp_nom ?? "Compétition",
            hasPrediction: match.prediction !== null && match.prediction !== undefined,
            isLocked: Boolean(match.isLocked),
          }));

        const pendingPredictions = auth.personalized
          ? matches.filter((match) => !match.isLocked && !match.prediction).length
          : null;

        return {
          available: true,
          groupId,
          groupName: group.name ?? null,
          userRank: userRow?.rank ?? null,
          userTotalPoints: userRow?.totalPoints ?? null,
          memberCount: standings.length,
          pendingPredictions,
          personalized: auth.personalized,
          topStandings,
          upcomingMatches,
          matchdayUrl: publicUrl ?? null,
        };
      } catch {
        return { ...empty, available: false };
      }
    },
  };
}

export type MatchdayClient = ReturnType<typeof createMatchdayClient>;
