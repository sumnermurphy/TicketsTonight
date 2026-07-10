import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), "public");
const distDir = join(process.cwd(), "dist");
const fontsDir = join(process.cwd(), "assets", "fonts");

if (!existsSync(publicDir) || !existsSync(distDir)) {
  process.exit(0);
}

mkdirSync(distDir, { recursive: true });
cpSync(publicDir, distDir, { recursive: true });

if (existsSync(fontsDir)) {
  cpSync(fontsDir, join(distDir, "fonts"), { recursive: true });
}

const indexPath = join(distDir, "index.html");

if (existsSync(indexPath)) {
  const indexHtml = readFileSync(indexPath, "utf8");
  const walkerFontTags = [
    "<style>",
    "@font-face{font-family:'Walker Display';src:url('/fonts/EBGaramond.ttf') format('truetype');font-weight:400 800;font-style:normal;font-display:swap;}",
    "@font-face{font-family:'Walker Sans';src:url('/fonts/Inter.ttf') format('truetype');font-weight:100 900;font-style:normal;font-display:swap;}",
    "</style>"
  ].join("");
  const pwaHeadTags = [
    '<link rel="manifest" href="/manifest.json">',
    '<link rel="apple-touch-icon" href="/walker-icon-192.png">',
    '<meta name="theme-color" content="#0D3B2E">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">'
  ].join("");

  let nextHtml = indexHtml;

  if (!nextHtml.includes("Walker Display")) {
    nextHtml = nextHtml.replace("<head>", `<head>${walkerFontTags}`);
  }

  if (!nextHtml.includes('rel="manifest"')) {
    nextHtml = nextHtml.replace("<head>", `<head>${pwaHeadTags}`);
  }

  if (nextHtml !== indexHtml) {
    writeFileSync(indexPath, nextHtml);
  }
}
