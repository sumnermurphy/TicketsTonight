import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), "public");
const distDir = join(process.cwd(), "dist");

if (!existsSync(publicDir) || !existsSync(distDir)) {
  process.exit(0);
}

mkdirSync(distDir, { recursive: true });
cpSync(publicDir, distDir, { recursive: true });

const indexPath = join(distDir, "index.html");

if (existsSync(indexPath)) {
  const indexHtml = readFileSync(indexPath, "utf8");
  const pwaHeadTags = [
    '<link rel="manifest" href="/manifest.json">',
    '<link rel="apple-touch-icon" href="/gallery-icon-192.png">',
    '<meta name="theme-color" content="#111111">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">'
  ].join("");

  if (!indexHtml.includes('rel="manifest"')) {
    writeFileSync(indexPath, indexHtml.replace("<head>", `<head>${pwaHeadTags}`));
  }
}
