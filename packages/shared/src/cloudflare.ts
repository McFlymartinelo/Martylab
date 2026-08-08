export interface CloudflareHostnameCheck {
  hostname: string;
  online: boolean;
  statusCode: number | null;
  latencyMs: number | null;
}

export interface CloudflareStatusResponse {
  configured: boolean;
  online: boolean;
  tunnelId: string | null;
  tunnelName: string | null;
  tunnelStatus: string | null;
  activeConnections: number | null;
  hostnames: CloudflareHostnameCheck[];
}
