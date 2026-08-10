export type ImmichInstanceId = "photos" | "photosshared";

export interface ImmichInstanceStatus {
  id: ImmichInstanceId;
  label: string;
  configured: boolean;
  online: boolean;
  version: string | null;
  immichUrl: string | null;
}

export interface ImmichStatusResponse {
  instances: ImmichInstanceStatus[];
  anyConfigured: boolean;
  anyOnline: boolean;
}

export interface ImmichAssetStats {
  images: number;
  videos: number;
  total: number;
}

export interface ImmichAlbumSummary {
  id: string;
  name: string;
  assetCount: number;
  thumbnailUrl: string | null;
  shared: boolean;
  createdAt: string | null;
}

export interface ImmichInstanceSummary {
  id: ImmichInstanceId;
  label: string;
  available: boolean;
  immichUrl: string | null;
  version: string | null;
  stats: ImmichAssetStats | null;
  albumCount: number;
  sharedAlbumCount: number;
  albums: ImmichAlbumSummary[];
}

export interface ImmichSummaryResponse {
  instances: ImmichInstanceSummary[];
}

export interface ImmichPageResponse {
  instances: ImmichInstanceSummary[];
}
