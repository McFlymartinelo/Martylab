import { Router } from "express";
import type {
  MatchdayStatusResponse,
  MatchdaySummaryResponse,
} from "@martylab/shared";
import type { MatchdayClient } from "../connectors/matchday/matchday-client.js";
import { AppError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

export function createMatchdayRouter(matchdayClient: MatchdayClient) {
  const matchdayRouter = Router();

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

    const body: MatchdaySummaryResponse = await matchdayClient.getSummary({
      martylabUsername: req.user.username,
      martylabDisplayName: req.user.displayName,
    });

    res.status(200).json(body);
  });

  return matchdayRouter;
}
