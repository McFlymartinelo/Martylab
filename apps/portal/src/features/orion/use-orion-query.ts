import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrionClimateMetric, OrionClimateRange, OrionSetLightRequest } from "@martylab/shared";
import {
  fetchOrionClimate,
  fetchOrionClimateHistory,
  fetchOrionLights,
  fetchOrionNotifications,
  fetchOrionStatus,
  setOrionLight,
} from "@/features/orion/orion-api";

export const orionStatusQueryKey = ["orion", "status"] as const;
export const orionClimateQueryKey = ["orion", "climate"] as const;
export const orionClimateHistoryQueryKey = (
  range: string,
  metric: string,
) => ["orion", "climate", "history", range, metric] as const;
export const orionNotificationsQueryKey = ["orion", "notifications"] as const;
export const orionLightsQueryKey = ["orion", "lights"] as const;

export function useOrionStatusQuery() {
  return useQuery({
    queryKey: orionStatusQueryKey,
    queryFn: fetchOrionStatus,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useOrionClimateQuery(enabled = true) {
  return useQuery({
    queryKey: orionClimateQueryKey,
    queryFn: fetchOrionClimate,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useOrionClimateHistoryQuery(
  input: { range: OrionClimateRange; metric: OrionClimateMetric },
  enabled = true,
) {
  return useQuery({
    queryKey: orionClimateHistoryQueryKey(input.range, input.metric),
    queryFn: () => fetchOrionClimateHistory(input),
    enabled,
    refetchInterval: 5 * 60_000,
    staleTime: 2 * 60_000,
  });
}

export function useOrionNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: orionNotificationsQueryKey,
    queryFn: fetchOrionNotifications,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useOrionLightsQuery(enabled = true) {
  return useQuery({
    queryKey: orionLightsQueryKey,
    queryFn: fetchOrionLights,
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useOrionLightMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lightId,
      body,
    }: {
      lightId: string;
      body: OrionSetLightRequest;
    }) => setOrionLight(lightId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orionLightsQueryKey });
    },
  });
}
