import type {
  MatchdayStatusResponse,
  MatchdaySummaryResponse,
} from "@martylab/shared";
import { apiGet } from "@/lib/api-client";

export function fetchMatchdayStatus(): Promise<MatchdayStatusResponse> {
  return apiGet<MatchdayStatusResponse>("/api/matchday/status");
}

export function fetchMatchdaySummary(): Promise<MatchdaySummaryResponse> {
  return apiGet<MatchdaySummaryResponse>("/api/matchday/summary");
}
