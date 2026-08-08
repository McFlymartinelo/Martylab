export interface JellyfinStatusResponse {
  configured: boolean;
  online: boolean;
  serverName: string | null;
  version: string | null;
  jellyfinUrl: string | null;
}

export interface JellyfinLibrary {
  id: string;
  name: string;
  type: string;
  itemCount: number | null;
}

export interface JellyfinMediaItem {
  id: string;
  name: string;
  type: string;
  year: number | null;
  overview: string | null;
  imageUrl: string | null;
  playedPercent: number | null;
  seriesName: string | null;
  seasonEpisode: string | null;
}

export interface JellyfinPlaybackSession {
  id: string;
  userName: string;
  client: string;
  isPaused: boolean;
  itemName: string | null;
  itemType: string | null;
  positionTicks: number | null;
  durationTicks: number | null;
}

export interface JellyfinServerInfo {
  serverName: string;
  version: string;
  operatingSystem: string | null;
  activeSessions: number;
}

export interface JellyfinSummaryResponse {
  available: boolean;
  jellyfinUrl: string | null;
  serverName: string | null;
  version: string | null;
  activeSessions: number;
  resumeCount: number;
  latestCount: number;
  resumeItems: JellyfinMediaItem[];
  latestItems: JellyfinMediaItem[];
}

export interface JellyfinPageResponse {
  available: boolean;
  jellyfinUrl: string | null;
  server: JellyfinServerInfo | null;
  libraries: JellyfinLibrary[];
  resumeItems: JellyfinMediaItem[];
  latestItems: JellyfinMediaItem[];
  movies: JellyfinMediaItem[];
  series: JellyfinMediaItem[];
  sessions: JellyfinPlaybackSession[];
}
