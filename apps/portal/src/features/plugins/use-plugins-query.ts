import { useQuery } from "@tanstack/react-query";
import { fetchPlugins } from "@/features/plugins/plugins-api";

export const pluginsQueryKey = ["plugins"] as const;

export function usePluginsQuery() {
  return useQuery({
    queryKey: pluginsQueryKey,
    queryFn: fetchPlugins,
  });
}
