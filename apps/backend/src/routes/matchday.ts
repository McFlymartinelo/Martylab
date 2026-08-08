import { Router } from "express";
import type {
  MatchdayNotificationsResponse,
  MatchdayPageResponse,
  MatchdayStatusResponse,
  MatchdaySummaryResponse,
} from "@martylab/shared";
import type { MatchdayClient } from "../connectors/matchday/matchday-client.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import type { Request } from "express";

export function createMatchdayRouter(matchdayClient: MatchdayClient) {
  const matchdayRouter = Router();

  function requireMatchdayUser(req: Request) {
    if (!matchdayClient.isConfigured) {
      throw new AppError(
        503,
        "matchday_not_configured",
        "Matchday connector is not configured.",
      );
    }

    if (!matchdayClient.hasServiceCredentials) {
      throw new AppError(
        503,
        "matchday_not_configured",
        "Matchday service credentials are not configured.",
      );
    }

    if (!req.user) {
      throw new AppError(401, "unauthenticated", "Authentication required.");
    }

    return {
      martylabUsername: req.user.username,
      martylabDisplayName: req.user.displayName,
    };
  }

  matchdayRouter.get("/status", requireAuth, async (_req, res) => {
    const body: MatchdayStatusResponse = await matchdayClient.checkHealth();
    res.status(200).json(body);
  });

  matchdayRouter.get("/summary", requireAuth, async (req, res) => {
    if (!matchdayClient.isConfigured) {
      const body: MatchdaySummaryResponse = {
        available: false,
        groupId: null,
        groupName: null,
        userRank: null,
        userTotalPoints: null,
        memberCount: null,
        pendingPredictions: null,
        personalized: false,
        topStandings: [],
        upcomingMatches: [],
        matchdayUrl: matchdayClient.publicUrl,
      };
      res.status(200).json(body);
      return;
    }

    const user = requireMatchdayUser(req);
    const body: MatchdaySummaryResponse = await matchdayClient.getSummary(user);
    res.status(200).json(body);
  });

  matchdayRouter.get("/page", requireAuth, async (req, res) => {
    if (!matchdayClient.isConfigured) {
      const body: MatchdayPageResponse = {
        available: false,
        groupId: null,
        groupName: null,
        matchdayUrl: matchdayClient.publicUrl,
        personalized: false,
        userRank: null,
        userTotalPoints: null,
        pendingPredictions: null,
        todayMatches: [],
        upcomingMatches: [],
        standings: [],
        recentMessages: [],
      };
      res.status(200).json(body);
      return;
    }

    const user = requireMatchdayUser(req);
    const body: MatchdayPageResponse = await matchdayClient.getPage(user);
    res.status(200).json(body);
  });

  matchdayRouter.get("/notifications", requireAuth, async (req, res) => {
    if (!matchdayClient.isConfigured) {
      const body: MatchdayNotificationsResponse = {
        available: false,
        items: [],
      };
      res.status(200).json(body);
      return;
    }

    const user = requireMatchdayUser(req);
    const body: MatchdayNotificationsResponse =
      await matchdayClient.getNotifications(user);
    res.status(200).json(body);
  });

  return matchdayRouter;
}
