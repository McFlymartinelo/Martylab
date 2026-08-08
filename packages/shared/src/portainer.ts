export interface PortainerStatusResponse {
  configured: boolean;
  online: boolean;
  version: string | null;
  endpointId: number | null;
  endpointName: string | null;
}

export interface PortainerContainerSummary {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
}

export interface PortainerImageSummary {
  id: string;
  tags: string[];
  sizeBytes: number;
  createdAt: string | null;
}

export interface PortainerVolumeSummary {
  name: string;
  driver: string;
  mountpoint: string;
}

export interface PortainerOverviewResponse {
  available: boolean;
  containers: PortainerContainerSummary[];
  images: PortainerImageSummary[];
  volumes: PortainerVolumeSummary[];
}
