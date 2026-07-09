import type { GalleryAreaId, GalleryExhibition, GalleryMedium } from "../types";

export type GalleryVisualKey = "hero" | "painting" | "sculpture" | "photo-video";

export type GalleryVisual = {
  assetKey: GalleryVisualKey;
  alt: string;
  tone: "editorial" | "warm" | "quiet" | "cool";
};

const mediumVisuals: Partial<Record<GalleryMedium, GalleryVisualKey>> = {
  painting: "painting",
  prints: "painting",
  sculpture: "sculpture",
  installation: "sculpture",
  photography: "photo-video",
  video: "photo-video",
  performance: "photo-video",
  design: "sculpture",
  "mixed-media": "hero"
};

const visualTones: Record<GalleryVisualKey, GalleryVisual["tone"]> = {
  hero: "editorial",
  painting: "warm",
  sculpture: "quiet",
  "photo-video": "cool"
};

export function getGalleryVisual(exhibition: Pick<GalleryExhibition, "galleryName" | "mediums" | "source">): GalleryVisual {
  const preferredMedium = exhibition.mediums.find((medium) => mediumVisuals[medium]);
  const assetKey =
    preferredMedium && mediumVisuals[preferredMedium]
      ? mediumVisuals[preferredMedium]
      : exhibition.source === "seed-fixture"
        ? "hero"
        : "painting";

  return {
    assetKey,
    alt: `${exhibition.galleryName} exhibition visual`,
    tone: visualTones[assetKey]
  };
}

export function getGalleryHeroVisual(areaId: GalleryAreaId): GalleryVisual {
  return {
    assetKey: areaId === "hudson" ? "sculpture" : "hero",
    alt: `${areaId.toUpperCase()} gallery walk visual`,
    tone: areaId === "hudson" ? "quiet" : "editorial"
  };
}
