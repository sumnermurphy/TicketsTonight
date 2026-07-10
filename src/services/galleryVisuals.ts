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

export type WalkerImageRole =
  | "city-banner"
  | "neighborhood-banner"
  | "gallery-banner"
  | "exhibition-banner"
  | "card-thumbnail";

export type WalkerImageSourceType =
  | "walker-generated"
  | "official-gallery"
  | "partner-submitted"
  | "public-domain"
  | "stock-api"
  | "user-photo";

export type WalkerImagePermissionStatus = "safe" | "needs-review" | "partner-approved";

export type WalkerVisualCreditLabel =
  | "Editorial image"
  | "Official gallery photo"
  | "Partner photo"
  | "Public-domain image"
  | "Stock image"
  | "User photo"
  | "Needs image review";

export type WalkerVisualAsset = {
  id: string;
  role: WalkerImageRole;
  areaId?: GalleryAreaId;
  neighborhood?: string;
  galleryName?: string;
  exhibitionId?: string;
  assetKey: GalleryVisualKey;
  sourceType: WalkerImageSourceType;
  licenseLabel: string;
  attribution: string;
  sourceUrl?: string;
  permissionStatus: WalkerImagePermissionStatus;
  checkedAt: string;
  focalPoint?: { x: number; y: number };
};

export type GalleryVisual = {
  assetKey: GalleryVisualKey;
  alt: string;
  tone: "editorial" | "warm" | "quiet" | "cool" | "coastal" | "historic";
  creditLabel: WalkerVisualCreditLabel;
  role?: WalkerImageRole;
  sourceType?: WalkerImageSourceType;
  licenseLabel?: string;
  attribution?: string;
  sourceUrl?: string;
  permissionStatus?: WalkerImagePermissionStatus;
  checkedAt?: string;
};

export type WalkerResolvedVisual = GalleryVisual & {
  role: WalkerImageRole;
  sourceType: WalkerImageSourceType;
  licenseLabel: string;
  attribution: string;
  permissionStatus: WalkerImagePermissionStatus;
  checkedAt: string;
};

export type WalkerVisualRequest = {
  role: WalkerImageRole;
  areaId?: GalleryAreaId;
  neighborhood?: string;
  exhibition?: Pick<
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
    Partial<Pick<GalleryExhibition, "galleryKind" | "neighborhood" | "whyGoSignals">>;
};

export type WalkerImageReadinessReport = {
  totalAssets: number;
  cityBannerCount: number;
  neighborhoodBannerCount: number;
  galleryBannerCount: number;
  exhibitionBannerCount: number;
  editorialFallbackCount: number;
  needsReviewCount: number;
  unsafeOfficialAssetIds: string[];
};

export type WalkerImageSystemSummary = {
  headline: string;
  detail: string;
  coverageChips: string[];
  provenanceLabel: WalkerVisualCreditLabel;
  needsOfficialImageReview: boolean;
};

const walkerGeneratedLicenseLabel = "Walker generated editorial placeholder";
const walkerGeneratedAttribution = "Walker editorial image system";
const walkerVisualCheckedAt = "2026-07-10T20:00:00+02:00";

function createWalkerGeneratedAsset(
  id: string,
  role: WalkerImageRole,
  assetKey: GalleryVisualKey,
  options: {
    areaId?: GalleryAreaId;
    neighborhood?: string;
    galleryName?: string;
    exhibitionId?: string;
    focalPoint?: { x: number; y: number };
  } = {}
): WalkerVisualAsset {
  return {
    id,
    role,
    areaId: options.areaId,
    neighborhood: options.neighborhood,
    galleryName: options.galleryName,
    exhibitionId: options.exhibitionId,
    assetKey,
    sourceType: "walker-generated",
    licenseLabel: walkerGeneratedLicenseLabel,
    attribution: walkerGeneratedAttribution,
    permissionStatus: "safe",
    checkedAt: walkerVisualCheckedAt,
    focalPoint: options.focalPoint
  };
}

export const walkerVisualAssets: WalkerVisualAsset[] = [
  createWalkerGeneratedAsset("city-nyc", "city-banner", "walker-gallery-interior", {
    areaId: "nyc",
    focalPoint: { x: 0.5, y: 0.42 }
  }),
  createWalkerGeneratedAsset("city-la", "city-banner", "la-opening", {
    areaId: "la",
    focalPoint: { x: 0.48, y: 0.44 }
  }),
  createWalkerGeneratedAsset("city-hudson", "city-banner", "hudson-historic", {
    areaId: "hudson",
    focalPoint: { x: 0.5, y: 0.46 }
  }),
  createWalkerGeneratedAsset("city-camogli", "city-banner", "camogli-harbor-editorial", {
    areaId: "camogli",
    focalPoint: { x: 0.52, y: 0.4 }
  }),
  createWalkerGeneratedAsset("neighborhood-nyc-chelsea", "neighborhood-banner", "nyc-opening", {
    areaId: "nyc",
    neighborhood: "Chelsea"
  }),
  createWalkerGeneratedAsset("neighborhood-nyc-tribeca", "neighborhood-banner", "nyc-quiet", {
    areaId: "nyc",
    neighborhood: "Tribeca"
  }),
  createWalkerGeneratedAsset("neighborhood-nyc-les", "neighborhood-banner", "nyc-installation", {
    areaId: "nyc",
    neighborhood: "Lower East Side"
  }),
  createWalkerGeneratedAsset("neighborhood-hudson-warren", "neighborhood-banner", "hudson-historic", {
    areaId: "hudson",
    neighborhood: "Warren Street"
  }),
  createWalkerGeneratedAsset("neighborhood-camogli-centro", "neighborhood-banner", "camogli-stone-lanes", {
    areaId: "camogli",
    neighborhood: "Camogli Centro"
  }),
  createWalkerGeneratedAsset("neighborhood-camogli-waterfront", "neighborhood-banner", "camogli-waterfront-heritage", {
    areaId: "camogli",
    neighborhood: "Porto / Waterfront"
  }),
  createWalkerGeneratedAsset("gallery-camogli-museo-marinaro", "gallery-banner", "camogli-maritime-museum", {
    areaId: "camogli",
    neighborhood: "Camogli Centro",
    galleryName: "Museo Marinaro Gio Bono Ferrari"
  }),
  createWalkerGeneratedAsset("gallery-camogli-teatro-sociale", "gallery-banner", "camogli-theatre-evening", {
    areaId: "camogli",
    neighborhood: "Camogli Centro",
    galleryName: "Teatro Sociale Camogli"
  })
];

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

type GalleryVisualExhibitionInput = Pick<
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
  Partial<Pick<GalleryExhibition, "galleryKind" | "neighborhood" | "whyGoSignals">>;

function getCreditLabelForAsset(asset: WalkerVisualAsset): WalkerVisualCreditLabel {
  if (asset.permissionStatus === "needs-review") {
    return "Needs image review";
  }

  switch (asset.sourceType) {
    case "official-gallery":
      return "Official gallery photo";
    case "partner-submitted":
      return "Partner photo";
    case "public-domain":
      return "Public-domain image";
    case "stock-api":
      return "Stock image";
    case "user-photo":
      return "User photo";
    case "walker-generated":
    default:
      return "Editorial image";
  }
}

function createResolvedVisual(asset: WalkerVisualAsset, alt: string): WalkerResolvedVisual {
  return {
    assetKey: asset.assetKey,
    alt,
    tone: visualTones[asset.assetKey],
    creditLabel: getCreditLabelForAsset(asset),
    role: asset.role,
    sourceType: asset.sourceType,
    licenseLabel: asset.licenseLabel,
    attribution: asset.attribution,
    sourceUrl: asset.sourceUrl,
    permissionStatus: asset.permissionStatus,
    checkedAt: asset.checkedAt
  };
}

function createEditorialFallbackVisual(
  assetKey: GalleryVisualKey,
  role: WalkerImageRole,
  alt: string
): WalkerResolvedVisual {
  return {
    assetKey,
    alt,
    tone: visualTones[assetKey],
    creditLabel: "Editorial image",
    role,
    sourceType: "walker-generated",
    licenseLabel: walkerGeneratedLicenseLabel,
    attribution: walkerGeneratedAttribution,
    permissionStatus: "safe",
    checkedAt: walkerVisualCheckedAt
  };
}

function getCityBannerAsset(areaId: GalleryAreaId): WalkerVisualAsset | undefined {
  return walkerVisualAssets.find((asset) => asset.role === "city-banner" && asset.areaId === areaId);
}

function getNeighborhoodBannerAsset(
  areaId: GalleryAreaId,
  neighborhood?: string
): WalkerVisualAsset | undefined {
  if (!neighborhood) {
    return undefined;
  }

  return walkerVisualAssets.find(
    (asset) =>
      asset.role === "neighborhood-banner" &&
      asset.areaId === areaId &&
      asset.neighborhood === neighborhood
  );
}

function getGalleryBannerAsset(exhibition: Pick<GalleryVisualExhibitionInput, "areaId" | "galleryName">): WalkerVisualAsset | undefined {
  return walkerVisualAssets.find(
    (asset) =>
      asset.role === "gallery-banner" &&
      asset.areaId === exhibition.areaId &&
      asset.galleryName === exhibition.galleryName &&
      asset.permissionStatus !== "needs-review"
  );
}

function getExhibitionBannerAsset(exhibition: Pick<GalleryVisualExhibitionInput, "id">): WalkerVisualAsset | undefined {
  return walkerVisualAssets.find(
    (asset) =>
      asset.role === "exhibition-banner" &&
      asset.exhibitionId === exhibition.id &&
      asset.permissionStatus !== "needs-review"
  );
}

function getEditorialCardAssetKey(exhibition: GalleryVisualExhibitionInput): GalleryVisualKey {
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

  return exhibition.areaId === "camogli"
    ? camogliRouteAsset ?? mediumAsset ?? getStableFallbackVisual(exhibition)
    : trust.isFixture
      ? getStableFallbackVisual(exhibition)
      : mediumAsset ?? getStableFallbackVisual(exhibition);
}

export function getWalkerCityBanner(areaId: GalleryAreaId): WalkerResolvedVisual {
  const asset = getCityBannerAsset(areaId);

  if (asset) {
    return createResolvedVisual(asset, `${areaId.toUpperCase()} Walker city banner`);
  }

  return createEditorialFallbackVisual("hero", "city-banner", `${areaId.toUpperCase()} Walker city banner`);
}

export function getWalkerNeighborhoodBanner(
  areaId: GalleryAreaId,
  neighborhood?: string
): WalkerResolvedVisual {
  const asset = getNeighborhoodBannerAsset(areaId, neighborhood) ?? getCityBannerAsset(areaId);

  if (asset) {
    return createResolvedVisual(
      asset,
      `${neighborhood ?? areaId.toUpperCase()} Walker neighborhood banner`
    );
  }

  return getWalkerCityBanner(areaId);
}

export function getWalkerGalleryBanner(exhibition: GalleryVisualExhibitionInput): WalkerResolvedVisual {
  const asset = getGalleryBannerAsset(exhibition);

  if (asset) {
    return createResolvedVisual(asset, `${exhibition.galleryName} Walker gallery banner`);
  }

  return createEditorialFallbackVisual(
    getEditorialCardAssetKey(exhibition),
    "gallery-banner",
    `${exhibition.galleryName} editorial gallery visual`
  );
}

export function getWalkerExhibitionBanner(exhibition: GalleryVisualExhibitionInput): WalkerResolvedVisual {
  const asset = getExhibitionBannerAsset(exhibition) ?? getGalleryBannerAsset(exhibition);

  if (asset) {
    return createResolvedVisual(asset, `${exhibition.galleryName} - ${exhibition.title} Walker banner`);
  }

  return createEditorialFallbackVisual(
    getEditorialCardAssetKey(exhibition),
    "exhibition-banner",
    `${exhibition.galleryName} editorial exhibition visual`
  );
}

export function getWalkerVisualForRole(input: WalkerVisualRequest): WalkerResolvedVisual {
  if (input.role === "city-banner") {
    return getWalkerCityBanner(input.areaId ?? input.exhibition?.areaId ?? "nyc");
  }

  if (input.role === "neighborhood-banner") {
    return getWalkerNeighborhoodBanner(
      input.areaId ?? input.exhibition?.areaId ?? "nyc",
      input.neighborhood ?? input.exhibition?.neighborhood
    );
  }

  if (input.exhibition && input.role === "gallery-banner") {
    return getWalkerGalleryBanner(input.exhibition);
  }

  if (input.exhibition && input.role === "exhibition-banner") {
    return getWalkerExhibitionBanner(input.exhibition);
  }

  if (input.exhibition) {
    return createEditorialFallbackVisual(
      getEditorialCardAssetKey(input.exhibition),
      "card-thumbnail",
      `${input.exhibition.galleryName} editorial exhibition visual`
    );
  }

  return getWalkerCityBanner(input.areaId ?? "nyc");
}

export function getGalleryVisual(
  exhibition: GalleryVisualExhibitionInput
): GalleryVisual {
  return getWalkerVisualForRole({ role: "card-thumbnail", exhibition });
}

export function getGalleryHeroVisual(areaId: GalleryAreaId): GalleryVisual {
  return getWalkerCityBanner(areaId);
}

export function createWalkerImageReadinessReport(
  exhibitions: GalleryVisualExhibitionInput[]
): WalkerImageReadinessReport {
  const cityBannerCount = walkerVisualAssets.filter((asset) => asset.role === "city-banner").length;
  const neighborhoodBannerCount = walkerVisualAssets.filter((asset) => asset.role === "neighborhood-banner").length;
  const galleryBannerCount = walkerVisualAssets.filter((asset) => asset.role === "gallery-banner").length;
  const exhibitionBannerCount = walkerVisualAssets.filter((asset) => asset.role === "exhibition-banner").length;
  const needsReviewCount = walkerVisualAssets.filter((asset) => asset.permissionStatus === "needs-review").length;
  const unsafeOfficialAssetIds = walkerVisualAssets
    .filter((asset) => asset.sourceType !== "walker-generated")
    .filter(
      (asset) =>
        !asset.sourceUrl ||
        !asset.licenseLabel ||
        !asset.checkedAt ||
        asset.permissionStatus === "needs-review"
    )
    .map((asset) => asset.id);
  const editorialFallbackCount = exhibitions.filter((exhibition) => {
    const visual = getWalkerExhibitionBanner(exhibition);

    return visual.sourceType === "walker-generated";
  }).length;

  return {
    totalAssets: walkerVisualAssets.length,
    cityBannerCount,
    neighborhoodBannerCount,
    galleryBannerCount,
    exhibitionBannerCount,
    editorialFallbackCount,
    needsReviewCount,
    unsafeOfficialAssetIds
  };
}

export function createWalkerImageSystemSummary(
  report: WalkerImageReadinessReport
): WalkerImageSystemSummary {
  const roleCount =
    report.cityBannerCount +
    report.neighborhoodBannerCount +
    report.galleryBannerCount +
    report.exhibitionBannerCount;
  const hasRoleCoverage =
    report.cityBannerCount > 0 &&
    report.neighborhoodBannerCount > 0 &&
    report.galleryBannerCount > 0;

  return {
    headline: hasRoleCoverage ? "Layered Walker imagery is ready" : "Image roles need coverage",
    detail: hasRoleCoverage
      ? `${roleCount} city, neighborhood, gallery, and exhibition banner records are separated from official gallery links.`
      : "Add role-specific city, neighborhood, gallery, and exhibition image records before beta.",
    coverageChips: [
      `${report.cityBannerCount} city`,
      `${report.neighborhoodBannerCount} neighborhood`,
      `${report.galleryBannerCount} gallery`,
      `${report.exhibitionBannerCount} exhibit`,
      `${report.editorialFallbackCount} editorial fallback`
    ],
    provenanceLabel: "Editorial image",
    needsOfficialImageReview:
      report.needsReviewCount > 0 || report.unsafeOfficialAssetIds.length > 0
  };
}
