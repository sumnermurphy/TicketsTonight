import type { MusicAccountConnection, RecommendationContext, ShowCategory } from "../types";

export interface TasteProfileProvider {
  id: string;
  label: string;
  connectAccount(): Promise<MusicAccountConnection>;
  disconnectAccount(connection: MusicAccountConnection): Promise<MusicAccountConnection>;
  getRecommendationContext(
    areaId: string,
    connection?: MusicAccountConnection | null
  ): Promise<RecommendationContext>;
}

export class DemoSpotifyTasteProvider implements TasteProfileProvider {
  id = "demo-spotify";
  label = "Spotify";

  async connectAccount(): Promise<MusicAccountConnection> {
    const now = new Date().toISOString();

    return {
      id: "spotify-demo-listener",
      service: "spotify",
      displayName: "Spotify Preview",
      status: "connected",
      connectedAt: now,
      topArtists: ["Alina Ives", "DJ Paloma", "Nia Vale"],
      topGenres: ["indie pop", "house", "dance"],
      updatedAt: now
    };
  }

  async disconnectAccount(connection: MusicAccountConnection): Promise<MusicAccountConnection> {
    return {
      ...connection,
      status: "disconnected",
      updatedAt: new Date().toISOString()
    };
  }

  async getRecommendationContext(
    areaId: string,
    connection?: MusicAccountConnection | null
  ): Promise<RecommendationContext> {
    const connected = connection?.status === "connected" ? connection : undefined;

    return {
      areaId,
      followedArtists: connected?.topArtists ?? [],
      spotifyTopGenres: connected?.topGenres ?? [],
      recentCategories: ["concert", "dj"] satisfies ShowCategory[]
    };
  }
}

export const tasteProfileProvider = new DemoSpotifyTasteProvider();
