import type {
  ImmichInstanceId,
  ImmichPageResponse,
  ImmichStatusResponse,
  ImmichSummaryResponse,
} from "@martylab/shared";
import {
  createImmichInstanceClient,
  type ImmichInstanceClient,
  type ImmichInstanceClientConfig,
} from "./immich-instance-client.js";

export interface ImmichInstanceEnvConfig {
  baseUrl?: string | undefined;
  publicUrl?: string | undefined;
  apiKey?: string | undefined;
}

export interface ImmichClientConfig {
  photos?: ImmichInstanceEnvConfig | undefined;
  photosShared?: ImmichInstanceEnvConfig | undefined;
  timeoutMs?: number | undefined;
}

const INSTANCE_DEFINITIONS: Array<{
  id: ImmichInstanceId;
  label: string;
  configKey: "photos" | "photosShared";
}> = [
  { id: "photos", label: "Photos", configKey: "photos" },
  { id: "photosshared", label: "Photos partagées", configKey: "photosShared" },
];

function createInstances(config: ImmichClientConfig): ImmichInstanceClient[] {
  const timeoutMs = config.timeoutMs ?? 6_000;

  return INSTANCE_DEFINITIONS.map(({ id, label, configKey }) => {
    const instanceConfig = config[configKey];

    return createImmichInstanceClient({
      id,
      label,
      baseUrl: instanceConfig?.baseUrl,
      publicUrl: instanceConfig?.publicUrl,
      apiKey: instanceConfig?.apiKey,
      timeoutMs,
    } satisfies ImmichInstanceClientConfig);
  });
}

export function createImmichClient(config: ImmichClientConfig) {
  const instances = createInstances(config);
  const instanceMap = new Map(
    instances.map((instance) => [instance.id, instance]),
  );

  return {
    isConfigured: instances.some((instance) => instance.isConfigured),

    getInstance(id: ImmichInstanceId): ImmichInstanceClient | undefined {
      return instanceMap.get(id);
    },

    async checkHealth(): Promise<ImmichStatusResponse> {
      const statuses = await Promise.all(
        instances.map((instance) => instance.checkHealth()),
      );

      return {
        instances: statuses,
        anyConfigured: statuses.some((status) => status.configured),
        anyOnline: statuses.some(
          (status) => status.configured && status.online,
        ),
      };
    },

    async getSummary(): Promise<ImmichSummaryResponse> {
      const summaries = await Promise.all(
        instances.map((instance) => instance.getSummary()),
      );

      return { instances: summaries };
    },

    async getPage(): Promise<ImmichPageResponse> {
      const pages = await Promise.all(
        instances.map((instance) => instance.getPage()),
      );

      return { instances: pages };
    },
  };
}

export type ImmichClient = ReturnType<typeof createImmichClient>;
