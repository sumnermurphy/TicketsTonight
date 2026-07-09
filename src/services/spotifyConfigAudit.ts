import {
  defaultSpotifyRedirectUri,
  spotifyScopes,
  type SpotifyTasteProfileProviderConfig
} from "./personalization";

export type SpotifyConfigAuditStatus =
  | "ready"
  | "missing-client-id"
  | "client-secret-present";

export type SpotifyConfigAuditSummary = {
  status: SpotifyConfigAuditStatus;
  clientIdConfigured: boolean;
  redirectUriConfigured: boolean;
  redirectUri: string;
  expectedNativeRedirectUri: string;
  scopes: string[];
  clientSecretPresent: boolean;
  action: string;
};

export function createSpotifyConfigAudit(
  config: SpotifyTasteProfileProviderConfig,
  options: {
    clientSecret?: string;
    scopes?: string[];
  } = {}
): SpotifyConfigAuditSummary {
  const clientIdConfigured = Boolean(config.clientId?.trim());
  const redirectUriConfigured = Boolean(config.redirectUri?.trim());
  const clientSecretPresent = Boolean(options.clientSecret?.trim());
  const status = getSpotifyConfigAuditStatus({
    clientIdConfigured,
    clientSecretPresent
  });

  return {
    status,
    clientIdConfigured,
    redirectUriConfigured,
    redirectUri: config.redirectUri?.trim() || defaultSpotifyRedirectUri,
    expectedNativeRedirectUri: defaultSpotifyRedirectUri,
    scopes: options.scopes?.length ? options.scopes : spotifyScopes,
    clientSecretPresent,
    action: getSpotifyConfigAuditAction(status, redirectUriConfigured)
  };
}

function getSpotifyConfigAuditStatus({
  clientIdConfigured,
  clientSecretPresent
}: {
  clientIdConfigured: boolean;
  clientSecretPresent: boolean;
}): SpotifyConfigAuditStatus {
  if (clientSecretPresent) {
    return "client-secret-present";
  }

  return clientIdConfigured ? "ready" : "missing-client-id";
}

function getSpotifyConfigAuditAction(
  status: SpotifyConfigAuditStatus,
  redirectUriConfigured: boolean
): string {
  if (status === "client-secret-present") {
    return "Remove Spotify client secrets from app env; keep only the public client id.";
  }

  if (status === "missing-client-id") {
    return "Set EXPO_PUBLIC_SPOTIFY_CLIENT_ID outside git before testing real Spotify auth.";
  }

  if (!redirectUriConfigured) {
    return `Register ${defaultSpotifyRedirectUri} in Spotify, or set EXPO_PUBLIC_SPOTIFY_REDIRECT_URI for web/local testing.`;
  }

  return "Spotify config is ready for an auth smoke test.";
}
