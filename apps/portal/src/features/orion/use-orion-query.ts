import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrionSetLightRequest } from "@martylab/shared";
import {
  fetchOrionClimate,
  fetchOrionLights,
  fetchOrionStatus,
  setOrionLight,
} from "@/features/orion/orion-api";

export const orionStatusQueryKey = ["orion", "status"] as const;
export const orionClimateQueryKey = ["orion", "climate"] as const;
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
