import { readPublicSpotifyConfig } from "../src/services/personalization";
import { createSpotifyConfigAudit } from "../src/services/spotifyConfigAudit";
import { loadLocalEnv } from "./env";

declare const process: {
  env: Record<string, string | undefined>;
};

function main() {
  loadLocalEnv();

  const audit = createSpotifyConfigAudit(readPublicSpotifyConfig(), {
    clientSecret:
      process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET ?? process.env.SPOTIFY_CLIENT_SECRET
  });

  console.log("Spotify config audit");
  console.log(`Status: ${audit.status}`);
  console.log(`Client ID: ${audit.clientIdConfigured ? "configured" : "missing"}`);
  console.log(`Redirect URI: ${audit.redirectUri}`);
  console.log(`Redirect configured: ${audit.redirectUriConfigured ? "yes" : "using native default"}`);
  console.log(`Expected native redirect: ${audit.expectedNativeRedirectUri}`);
  console.log(`Scopes: ${audit.scopes.join(", ")}`);
  console.log(
    `Client secret in app env: ${audit.clientSecretPresent ? "present - remove it" : "not present"}`
  );
  console.log(`Next action: ${audit.action}`);
}

main();
