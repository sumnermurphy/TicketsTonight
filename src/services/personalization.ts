import type {
  MusicAccountConnection,
  RecommendationContext,
  ShowCategory
} from "../types";

const DEFAULT_SPOTIFY_AUTHORIZATION_ENDPOINT = "https://accounts.spotify.com/authorize";
const DEFAULT_SPOTIFY_TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const DEFAULT_SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

export const defaultSpotifyRedirectUri = "ticketstonight://spotify-auth";
export const spotifyScopes = ["user-top-read"];

type PublicSpotifyEnv = {
  EXPO_PUBLIC_SPOTIFY_CLIENT_ID?: string;
  EXPO_PUBLIC_SPOTIFY_REDIRECT_URI?: string;
  EXPO_PUBLIC_SPOTIFY_AUTHORIZATION_ENDPOINT?: string;
  EXPO_PUBLIC_SPOTIFY_TOKEN_ENDPOINT?: string;
  EXPO_PUBLIC_SPOTIFY_API_BASE_URL?: string;
};

declare const process:
  | {
      env?: PublicSpotifyEnv;
    }
  | undefined;

type ExpoAuthSessionModule = typeof import("expo-auth-session");

export type SpotifyTasteProfileProviderConfig = {
  clientId?: string;
  redirectUri?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  apiBaseUrl?: string;
  scopes?: string[];
  now?: () => Date;
};

export type SpotifyAuthorizationRequest = {
  clientId: string;
  redirectUri?: string;
  authorizationEndpoint: string;
  scopes: string[];
};

export type SpotifyAuthorizationResult = {
  code: string;
  codeVerifier: string;
  redirectUri: string;
};

export type SpotifyCodeExchangeRequest = SpotifyAuthorizationResult & {
  clientId: string;
  tokenEndpoint: string;
  scopes: string[];
};

export type SpotifyRefreshRequest = {
  clientId: string;
  refreshToken: string;
  tokenEndpoint: string;
  scopes: string[];
};

export type SpotifyTokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
};

export type SpotifyUserProfile = {
  id: string;
  display_name?: string;
};

export type SpotifyArtist = {
  id?: string;
  name: string;
  genres?: string[];
};

export type SpotifyTrack = {
  id?: string;
  name: string;
  artists?: SpotifyArtist[];
};

export interface SpotifyAuthAdapter {
  authorize(request: SpotifyAuthorizationRequest): Promise<SpotifyAuthorizationResult>;
  exchangeCode(request: SpotifyCodeExchangeRequest): Promise<SpotifyTokenBundle>;
  refreshToken?(request: SpotifyRefreshRequest): Promise<SpotifyTokenBundle>;
}

export interface SpotifyApiClient {
  getCurrentUser(accessToken: string): Promise<SpotifyUserProfile>;
  getTopArtists(accessToken: string): Promise<SpotifyArtist[]>;
  getTopTracks(accessToken: string): Promise<SpotifyTrack[]>;
}

export interface TasteProfileProvider {
  id: string;
  label: string;
  isConfigured(): boolean;
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

  isConfigured(): boolean {
    return true;
  }

  async connectAccount(): Promise<MusicAccountConnection> {
    const now = new Date().toISOString();

    return {
      id: "spotify-demo-listener",
      service: "spotify",
      displayName: "Spotify Preview",
      status: "connected",
      connectedAt: now,
      topArtists: ["Alina Ives", "DJ Paloma", "Nia Vale"],
      topTracks: ["Electric Room", "After Hours Floor"],
      topGenres: ["indie pop", "house", "dance"],
      updatedAt: now
    };
  }

  async disconnectAccount(connection: MusicAccountConnection): Promise<MusicAccountConnection> {
    return createDisconnectedConnection(connection, new Date().toISOString());
  }

  async getRecommendationContext(
    areaId: string,
    connection?: MusicAccountConnection | null
  ): Promise<RecommendationContext> {
    return createRecommendationContext(areaId, connection);
  }
}

export class SpotifyTasteProfileProvider implements TasteProfileProvider {
  id = "spotify";
  label = "Spotify";

  private readonly authAdapter: SpotifyAuthAdapter;
  private readonly apiClient: SpotifyApiClient;

  constructor(
    private readonly config: SpotifyTasteProfileProviderConfig = {},
    dependencies: {
      authAdapter?: SpotifyAuthAdapter;
      apiClient?: SpotifyApiClient;
    } = {}
  ) {
    this.authAdapter = dependencies.authAdapter ?? new ExpoSpotifyAuthAdapter();
    this.apiClient =
      dependencies.apiClient ?? new FetchSpotifyApiClient(config.apiBaseUrl ?? DEFAULT_SPOTIFY_API_BASE_URL);
  }

  isConfigured(): boolean {
    return Boolean(this.config.clientId?.trim());
  }

  async connectAccount(): Promise<MusicAccountConnection> {
    const clientId = this.getClientId();
    const scopes = this.getScopes();
    const authorization = await this.authAdapter.authorize({
      clientId,
      redirectUri: this.config.redirectUri,
      authorizationEndpoint:
        this.config.authorizationEndpoint ?? DEFAULT_SPOTIFY_AUTHORIZATION_ENDPOINT,
      scopes
    });
    const tokenBundle = await this.authAdapter.exchangeCode({
      ...authorization,
      clientId,
      tokenEndpoint: this.config.tokenEndpoint ?? DEFAULT_SPOTIFY_TOKEN_ENDPOINT,
      scopes
    });

    return this.createConnectionFromTokenBundle(tokenBundle);
  }

  async disconnectAccount(connection: MusicAccountConnection): Promise<MusicAccountConnection> {
    return createDisconnectedConnection(connection, this.getNow().toISOString());
  }

  async getRecommendationContext(
    areaId: string,
    connection?: MusicAccountConnection | null
  ): Promise<RecommendationContext> {
    return createRecommendationContext(areaId, connection);
  }

  private async createConnectionFromTokenBundle(
    tokenBundle: SpotifyTokenBundle
  ): Promise<MusicAccountConnection> {
    const now = this.getNow();
    const [profile, topArtists, topTracks] = await Promise.all([
      this.apiClient.getCurrentUser(tokenBundle.accessToken),
      this.apiClient.getTopArtists(tokenBundle.accessToken),
      this.apiClient.getTopTracks(tokenBundle.accessToken)
    ]);
    const topArtistNames = uniqueStrings(topArtists.map((artist) => artist.name)).slice(0, 20);
    const topTrackNames = uniqueStrings(topTracks.map((track) => track.name)).slice(0, 20);
    const topGenres = uniqueStrings(topArtists.flatMap((artist) => artist.genres ?? [])).slice(
      0,
      20
    );

    return {
      id: profile.id,
      service: "spotify",
      displayName: profile.display_name ?? "Spotify Listener",
      status: "connected",
      connectedAt: now.toISOString(),
      accessToken: tokenBundle.accessToken,
      refreshToken: tokenBundle.refreshToken,
      expiresAt: tokenBundle.expiresIn
        ? new Date(now.getTime() + tokenBundle.expiresIn * 1000).toISOString()
        : undefined,
      scope: tokenBundle.scope,
      topArtists: topArtistNames,
      topTracks: topTrackNames,
      topGenres,
      updatedAt: now.toISOString()
    };
  }

  private getClientId(): string {
    const clientId = this.config.clientId?.trim();

    if (!clientId) {
      throw new Error("Spotify client ID is not configured.");
    }

    return clientId;
  }

  private getScopes(): string[] {
    return this.config.scopes?.length ? this.config.scopes : spotifyScopes;
  }

  private getNow(): Date {
    return this.config.now?.() ?? new Date();
  }
}

export class ExpoSpotifyAuthAdapter implements SpotifyAuthAdapter {
  async authorize(request: SpotifyAuthorizationRequest): Promise<SpotifyAuthorizationResult> {
    const AuthSession = await loadAuthSession();
    const redirectUri = request.redirectUri ?? defaultSpotifyRedirectUri;
    const authRequest = new AuthSession.AuthRequest({
      clientId: request.clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: request.scopes,
      usePKCE: true,
      codeChallengeMethod: AuthSession.CodeChallengeMethod.S256
    });
    const result = await authRequest.promptAsync({
      authorizationEndpoint: request.authorizationEndpoint
    });

    if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error("Spotify sign-in was cancelled.");
    }

    if (result.type !== "success") {
      throw new Error("Spotify authorization failed.");
    }

    const code = result.params.code;
    const codeVerifier = authRequest.codeVerifier;

    if (!code || !codeVerifier) {
      throw new Error("Spotify did not return a complete authorization code.");
    }

    return {
      code,
      codeVerifier,
      redirectUri
    };
  }

  async exchangeCode(request: SpotifyCodeExchangeRequest): Promise<SpotifyTokenBundle> {
    const AuthSession = await loadAuthSession();
    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: request.clientId,
        code: request.code,
        redirectUri: request.redirectUri,
        scopes: request.scopes,
        extraParams: {
          code_verifier: request.codeVerifier
        }
      },
      {
        tokenEndpoint: request.tokenEndpoint
      }
    );

    return normalizeTokenResponse(tokenResponse);
  }

  async refreshToken(request: SpotifyRefreshRequest): Promise<SpotifyTokenBundle> {
    const AuthSession = await loadAuthSession();
    const tokenResponse = await AuthSession.refreshAsync(
      {
        clientId: request.clientId,
        refreshToken: request.refreshToken,
        scopes: request.scopes
      },
      {
        tokenEndpoint: request.tokenEndpoint
      }
    );

    return normalizeTokenResponse(tokenResponse);
  }
}

export class FetchSpotifyApiClient implements SpotifyApiClient {
  constructor(private readonly apiBaseUrl = DEFAULT_SPOTIFY_API_BASE_URL) {}

  async getCurrentUser(accessToken: string): Promise<SpotifyUserProfile> {
    return this.requestJson<SpotifyUserProfile>("/me", accessToken);
  }

  async getTopArtists(accessToken: string): Promise<SpotifyArtist[]> {
    const response = await this.requestJson<{ items?: SpotifyArtist[] }>(
      "/me/top/artists?time_range=medium_term&limit=20",
      accessToken
    );

    return response.items ?? [];
  }

  async getTopTracks(accessToken: string): Promise<SpotifyTrack[]> {
    const response = await this.requestJson<{ items?: SpotifyTrack[] }>(
      "/me/top/tracks?time_range=medium_term&limit=20",
      accessToken
    );

    return response.items ?? [];
  }

  private async requestJson<T>(path: string, accessToken: string): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Spotify request failed with ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

export function readPublicSpotifyConfig(): SpotifyTasteProfileProviderConfig {
  if (typeof process === "undefined") {
    return {};
  }

  return {
    clientId: process.env?.EXPO_PUBLIC_SPOTIFY_CLIENT_ID,
    redirectUri: process.env?.EXPO_PUBLIC_SPOTIFY_REDIRECT_URI,
    authorizationEndpoint: process.env?.EXPO_PUBLIC_SPOTIFY_AUTHORIZATION_ENDPOINT,
    tokenEndpoint: process.env?.EXPO_PUBLIC_SPOTIFY_TOKEN_ENDPOINT,
    apiBaseUrl: process.env?.EXPO_PUBLIC_SPOTIFY_API_BASE_URL
  };
}

function createRecommendationContext(
  areaId: string,
  connection?: MusicAccountConnection | null
): RecommendationContext {
  const connected = connection?.status === "connected" ? connection : undefined;
  const topGenres = connected?.topGenres ?? [];

  return {
    areaId,
    followedArtists: connected?.topArtists ?? [],
    spotifyTopTracks: connected?.topTracks ?? [],
    spotifyTopGenres: topGenres,
    recentCategories: getCategoriesFromGenres(topGenres)
  };
}

function getCategoriesFromGenres(genres: string[]): ShowCategory[] {
  const categories = new Set<ShowCategory>();
  const normalizedGenres = genres.map(normalize);

  for (const genre of normalizedGenres) {
    if (matchesAny(genre, ["house", "techno", "electronic", "dance", "club"])) {
      categories.add("dj");
      categories.add("concert");
    }

    if (matchesAny(genre, ["pop", "rock", "indie", "folk", "hip hop", "r&b", "soul"])) {
      categories.add("concert");
    }

    if (matchesAny(genre, ["classical", "opera"])) {
      categories.add("opera");
      categories.add("ballet");
    }

    if (matchesAny(genre, ["musical", "broadway", "soundtrack"])) {
      categories.add("theater");
    }
  }

  return Array.from(categories);
}

function createDisconnectedConnection(
  connection: MusicAccountConnection,
  updatedAt: string
): MusicAccountConnection {
  return {
    id: connection.id,
    service: connection.service,
    displayName: connection.displayName,
    status: "disconnected",
    connectedAt: connection.connectedAt,
    topArtists: connection.topArtists,
    topTracks: connection.topTracks,
    topGenres: connection.topGenres,
    updatedAt
  };
}

function normalizeTokenResponse(tokenResponse: {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}): SpotifyTokenBundle {
  return {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    expiresIn: tokenResponse.expiresIn,
    scope: tokenResponse.scope
  };
}

async function loadAuthSession(): Promise<ExpoAuthSessionModule> {
  return import("expo-auth-session");
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    const normalizedValue = value?.trim();

    if (!normalizedValue || seen.has(normalize(normalizedValue))) {
      continue;
    }

    seen.add(normalize(normalizedValue));
    uniqueValues.push(normalizedValue);
  }

  return uniqueValues;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]+/g, " ");
}

function matchesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

export const tasteProfileProvider = new SpotifyTasteProfileProvider(readPublicSpotifyConfig());
