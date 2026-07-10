import type { GalleryAreaId, GalleryExhibition, GalleryMedium } from "../types";
import { getGalleryInventoryTrust } from "./galleryDiscovery";

export const galleryVisualKeys = [
  "hero",
  "painting",
  "sculpture",
  "photo-video",
  "nyc-painting",
  "nyc-photo",
  "nyc-sculpture",
  "nyc-installation",
  "nyc-opening",
  "nyc-quiet",
  "la-painting",
  "la-photo",
  "la-sculpture",
  "la-installation",
  "la-design",
  "la-opening",
  "hudson-painting",
  "hudson-sculpture",
  "hudson-historic",
  "hudson-quiet",
  "hudson-opening",
  "hudson-mixed",
  "camogli-coastal",
  "camogli-historic",
  "camogli-performance",
  "camogli-design",
  "camogli-photo",
  "camogli-quiet"
] as const;

export type GalleryVisualKey = (typeof galleryVisualKeys)[number];

export type GalleryVisual = {
  assetKey: GalleryVisualKey;
  alt: string;
  tone: "editorial" | "warm" | "quiet" | "cool" | "coastal" | "historic";
  creditLabel: "Editorial image";
};

const marketVisuals: Record<GalleryAreaId, GalleryVisualKey[]> = {
  nyc: ["nyc-painting", "nyc-photo", "nyc-sculpture", "nyc-installation", "nyc-opening", "nyc-quiet"],
  la: ["la-painting", "la-photo", "la-sculpture", "la-installation", "la-design", "la-opening"],
  hudson: [
    "hudson-painting",
    "hudson-sculpture",
    "hudson-historic",
    "hudson-quiet",
    "hudson-opening",
    "hudson-mixed"
  ],
  camogli: [
    "camogli-coastal",
    "camogli-historic",
    "camogli-performance",
    "camogli-design",
    "camogli-photo",
    "camogli-quiet"
  ]
};

const mediumVisuals: Partial<Record<GalleryMedium, Record<GalleryAreaId, GalleryVisualKey>>> = {
  painting: {
    nyc: "nyc-painting",
    la: "la-painting",
    hudson: "hudson-painting",
    camogli: "camogli-design"
  },
  prints: {
    nyc: "nyc-painting",
    la: "la-painting",
    hudson: "hudson-painting",
    camogli: "camogli-photo"
  },
  sculpture: {
    nyc: "nyc-sculpture",
    la: "la-sculpture",
    hudson: "hudson-sculpture",
    camogli: "camogli-historic"
  },
  installation: {
    nyc: "nyc-installation",
    la: "la-installation",
    hudson: "hudson-mixed",
    camogli: "camogli-historic"
  },
  photography: {
    nyc: "nyc-photo",
    la: "la-photo",
    hudson: "hudson-quiet",
    camogli: "camogli-photo"
  },
  video: {
    nyc: "nyc-photo",
    la: "la-photo",
    hudson: "hudson-mixed",
    camogli: "camogli-photo"
  },
  performance: {
    nyc: "nyc-opening",
    la: "la-opening",
    hudson: "hudson-opening",
    camogli: "camogli-performance"
  },
  design: {
    nyc: "nyc-sculpture",
    la: "la-design",
    hudson: "hudson-historic",
    camogli: "camogli-design"
  },
  "mixed-media": {
    nyc: "nyc-installation",
    la: "la-installation",
    hudson: "hudson-mixed",
    camogli: "camogli-coastal"
  }
};

const visualTones: Record<GalleryVisualKey, GalleryVisual["tone"]> = {
  hero: "editorial",
  painting: "warm",
  sculpture: "quiet",
  "photo-video": "cool",
  "nyc-painting": "warm",
  "nyc-photo": "cool",
  "nyc-sculpture": "quiet",
  "nyc-installation": "editorial",
  "nyc-opening": "cool",
  "nyc-quiet": "quiet",
  "la-painting": "warm",
  "la-photo": "cool",
  "la-sculpture": "warm",
  "la-installation": "editorial",
  "la-design": "warm",
  "la-opening": "cool",
  "hudson-painting": "warm",
  "hudson-sculpture": "quiet",
  "hudson-historic": "historic",
  "hudson-quiet": "quiet",
  "hudson-opening": "warm",
  "hudson-mixed": "editorial",
  "camogli-coastal": "coastal",
  "camogli-historic": "historic",
  "camogli-performance": "editorial",
  "camogli-design": "warm",
  "camogli-photo": "cool",
  "camogli-quiet": "quiet"
};

function hashText(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getStableFallbackVisual(exhibition: Pick<GalleryExhibition, "id" | "areaId" | "galleryName" | "title">): GalleryVisualKey {
  const keys = marketVisuals[exhibition.areaId] ?? marketVisuals.nyc;
  const hash = hashText(`${exhibition.id}:${exhibition.galleryName}:${exhibition.title}`);

  return keys[hash % keys.length] ?? keys[0] ?? "hero";
}

export function getGalleryVisual(
  exhibition: Pick<
    GalleryExhibition,
    | "id"
    | "areaId"
    | "galleryName"
    | "title"
    | "mediums"
    | "source"
    | "sourceFreshness"
    | "sourceLegalStatus"
    | "sourceUpdatedAt"
    | "verifiedAsOf"
    | "sourceCheckedAt"
    | "externalUrl"
  >
): GalleryVisual {
  const preferredMedium = exhibition.mediums.find((medium) => mediumVisuals[medium]);
  const mediumAsset =
    preferredMedium && mediumVisuals[preferredMedium]
      ? mediumVisuals[preferredMedium]?.[exhibition.areaId]
      : undefined;
  const trust = getGalleryInventoryTrust(exhibition as GalleryExhibition);
  const assetKey =
    exhibition.areaId === "camogli"
      ? mediumAsset ?? getStableFallbackVisual(exhibition)
      : trust.isFixture
        ? getStableFallbackVisual(exhibition)
        : mediumAsset ?? getStableFallbackVisual(exhibition);

  return {
    assetKey,
    alt: `${exhibition.galleryName} editorial exhibition visual`,
    tone: visualTones[assetKey],
    creditLabel: "Editorial image"
  };
}

export function getGalleryHeroVisual(areaId: GalleryAreaId): GalleryVisual {
  const assetKey: GalleryVisualKey =
    areaId === "camogli"
      ? "camogli-coastal"
      : areaId === "hudson"
        ? "hudson-historic"
        : areaId === "la"
          ? "la-opening"
          : "nyc-opening";

  return {
    assetKey,
    alt: `${areaId.toUpperCase()} gallery walk editorial visual`,
    tone: visualTones[assetKey],
    creditLabel: "Editorial image"
  };
}
