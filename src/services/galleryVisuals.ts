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
  "camogli-quiet",
  "camogli-harbor-editorial",
  "camogli-maritime-museum",
  "camogli-stone-lanes",
  "camogli-theatre-evening",
  "camogli-hill-sea-view",
  "camogli-civic-library",
  "camogli-waterfront-heritage",
  "camogli-quiet-interior",
  "walker-gallery-interior",
  "walker-opening-night",
  "walker-sculpture-room",
  "walker-photo-video",
  "walker-quiet-painting",
  "walker-street-approach",
  "walker-design-detail",
  "walker-waterfront-cultural"
] as const;

export type GalleryVisualKey = (typeof galleryVisualKeys)[number];

export type GalleryVisual = {
  assetKey: GalleryVisualKey;
  alt: string;
  tone: "editorial" | "warm" | "quiet" | "cool" | "coastal" | "historic";
  creditLabel: "Editorial image";
};

const marketVisuals: Record<GalleryAreaId, GalleryVisualKey[]> = {
  nyc: [
    "nyc-painting",
    "nyc-photo",
    "nyc-sculpture",
    "nyc-installation",
    "nyc-opening",
    "nyc-quiet",
    "walker-gallery-interior",
    "walker-opening-night",
    "walker-sculpture-room",
    "walker-photo-video",
    "walker-quiet-painting",
    "walker-street-approach",
    "walker-design-detail"
  ],
  la: [
    "la-painting",
    "la-photo",
    "la-sculpture",
    "la-installation",
    "la-design",
    "la-opening",
    "walker-gallery-interior",
    "walker-opening-night",
    "walker-sculpture-room",
    "walker-photo-video",
    "walker-design-detail"
  ],
  hudson: [
    "hudson-painting",
    "hudson-sculpture",
    "hudson-historic",
    "hudson-quiet",
    "hudson-opening",
    "hudson-mixed",
    "walker-street-approach",
    "walker-quiet-painting",
    "walker-waterfront-cultural"
  ],
  camogli: [
    "camogli-coastal",
    "camogli-historic",
    "camogli-performance",
    "camogli-design",
    "camogli-photo",
    "camogli-quiet",
    "camogli-harbor-editorial",
    "camogli-maritime-museum",
    "camogli-stone-lanes",
    "camogli-theatre-evening",
    "camogli-hill-sea-view",
    "camogli-civic-library",
    "camogli-waterfront-heritage",
    "camogli-quiet-interior"
  ]
};

const mediumVisuals: Partial<Record<GalleryMedium, Record<GalleryAreaId, GalleryVisualKey>>> = {
  painting: {
    nyc: "walker-quiet-painting",
    la: "walker-quiet-painting",
    hudson: "hudson-painting",
    camogli: "camogli-design"
  },
  prints: {
    nyc: "walker-quiet-painting",
    la: "la-painting",
    hudson: "hudson-painting",
    camogli: "camogli-photo"
  },
  sculpture: {
    nyc: "walker-sculpture-room",
    la: "walker-sculpture-room",
    hudson: "hudson-sculpture",
    camogli: "camogli-historic"
  },
  installation: {
    nyc: "walker-gallery-interior",
    la: "la-installation",
    hudson: "hudson-mixed",
    camogli: "camogli-historic"
  },
  photography: {
    nyc: "walker-photo-video",
    la: "walker-photo-video",
    hudson: "hudson-quiet",
    camogli: "camogli-photo"
  },
  video: {
    nyc: "walker-photo-video",
    la: "walker-photo-video",
    hudson: "hudson-mixed",
    camogli: "camogli-photo"
  },
  performance: {
    nyc: "walker-opening-night",
    la: "walker-opening-night",
    hudson: "hudson-opening",
    camogli: "camogli-theatre-evening"
  },
  design: {
    nyc: "walker-design-detail",
    la: "walker-design-detail",
    hudson: "hudson-historic",
    camogli: "camogli-maritime-museum"
  },
  "mixed-media": {
    nyc: "walker-gallery-interior",
    la: "la-installation",
    hudson: "hudson-mixed",
    camogli: "camogli-harbor-editorial"
  }
};

const camogliVenueVisuals: Record<string, GalleryVisualKey> = {
  museum: "camogli-maritime-museum",
  "cultural-venue": "camogli-theatre-evening",
  "heritage-site": "camogli-waterfront-heritage"
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
  "camogli-quiet": "quiet",
  "camogli-harbor-editorial": "coastal",
  "camogli-maritime-museum": "historic",
  "camogli-stone-lanes": "historic",
  "camogli-theatre-evening": "editorial",
  "camogli-hill-sea-view": "coastal",
  "camogli-civic-library": "quiet",
  "camogli-waterfront-heritage": "coastal",
  "camogli-quiet-interior": "quiet",
  "walker-gallery-interior": "editorial",
  "walker-opening-night": "editorial",
  "walker-sculpture-room": "quiet",
  "walker-photo-video": "cool",
  "walker-quiet-painting": "quiet",
  "walker-street-approach": "historic",
  "walker-design-detail": "warm",
  "walker-waterfront-cultural": "coastal"
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
  > &
    Partial<Pick<GalleryExhibition, "galleryKind" | "neighborhood" | "whyGoSignals">>
): GalleryVisual {
  const preferredMedium = exhibition.mediums.find((medium) => mediumVisuals[medium]);
  const mediumAsset =
    preferredMedium && mediumVisuals[preferredMedium]
      ? mediumVisuals[preferredMedium]?.[exhibition.areaId]
      : undefined;
  const trust = getGalleryInventoryTrust(exhibition as GalleryExhibition);
  const camogliRouteAsset =
    exhibition.areaId === "camogli" && exhibition.whyGoSignals?.includes("hill-walk")
      ? "camogli-hill-sea-view"
      : exhibition.areaId === "camogli" && exhibition.neighborhood === "Camogli Centro" && exhibition.galleryKind === "museum"
        ? "camogli-maritime-museum"
        : exhibition.areaId === "camogli" && exhibition.galleryKind
          ? camogliVenueVisuals[exhibition.galleryKind]
          : undefined;
  const assetKey =
    exhibition.areaId === "camogli"
      ? camogliRouteAsset ?? mediumAsset ?? getStableFallbackVisual(exhibition)
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
      ? "camogli-harbor-editorial"
      : areaId === "hudson"
        ? "hudson-historic"
        : areaId === "la"
          ? "walker-opening-night"
          : "walker-gallery-interior";

  return {
    assetKey,
    alt: `${areaId.toUpperCase()} gallery walk editorial visual`,
    tone: visualTones[assetKey],
    creditLabel: "Editorial image"
  };
}
