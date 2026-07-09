import type { GalleryAreaId, GalleryExhibition } from "../types";
import { getGalleryInventoryTrust } from "./galleryDiscovery";

export type GalleryFreshnessKind =
  | "verified-recently"
  | "verified-aging"
  | "verified"
  | "needs-review"
  | "fixture-demo";

export type GalleryFreshnessState = {
  kind: GalleryFreshnessKind;
  label: string;
  detail: string;
  checkedAt?: string;
  hasOfficialLink: boolean;
  isVerified: boolean;
  isFixture: boolean;
  daysSinceCheck?: number;
};

export type GalleryFreshnessSummary = {
  areaId: GalleryAreaId;
  totalCount: number;
  verifiedRecentlyCount: number;
  verifiedCount: number;
  verifiedAgingCount: number;
  needsReviewCount: number;
  fixtureDemoCount: number;
  officialLinkCount: number;
  needsReviewNext: GalleryFreshnessReviewItem[];
  summaryLabel: string;
  nextAction: string;
};

export type GalleryFreshnessReviewReason =
  | "stale-source"
  | "needs-review-source"
  | "fixture-demo"
  | "aging-verification"
  | "missing-official-link";

export type GalleryFreshnessReviewItem = {
  exhibitionId: string;
  title: string;
  galleryName: string;
  areaId: GalleryAreaId;
  neighborhood: string;
  freshness: GalleryFreshnessState;
  reasons: GalleryFreshnessReviewReason[];
  priority: "high" | "medium" | "low";
  actionLabel: string;
  officialUrl?: string;
};

const dayMs = 24 * 60 * 60 * 1000;

function getDatePart(iso: string, index: number): string {
  return iso.match(/^(\d{4})-(\d{2})-(\d{2})/)?.[index] ?? "";
}

function getDateOnlyTimestamp(iso: string): number {
  const year = Number(getDatePart(iso, 1) || "1970");
  const month = Number(getDatePart(iso, 2) || "1");
  const day = Number(getDatePart(iso, 3) || "1");

  return Date.UTC(year, month - 1, day);
}

function formatFreshnessDate(iso?: string): string {
  if (!iso) {
    return "unknown";
  }

  const month = Number(getDatePart(iso, 2));
  const day = Number(getDatePart(iso, 3));
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  return `${monthNames[month - 1] ?? "Date"} ${day || ""}`.trim();
}

function getDaysSinceCheck(checkedAt: string | undefined, referenceNow: string): number | undefined {
  if (!checkedAt) {
    return undefined;
  }

  return Math.max(0, Math.floor((getDateOnlyTimestamp(referenceNow) - getDateOnlyTimestamp(checkedAt)) / dayMs));
}

export function getGalleryFreshnessState(
  exhibition: GalleryExhibition,
  referenceNow: string
): GalleryFreshnessState {
  const trust = getGalleryInventoryTrust(exhibition);
  const checkedAt =
    exhibition.verifiedAsOf ?? exhibition.sourceCheckedAt ?? exhibition.sourceUpdatedAt;
  const daysSinceCheck = getDaysSinceCheck(checkedAt, referenceNow);

  if (trust.isFixture) {
    return {
      kind: "fixture-demo",
      label: "Fixture/demo",
      detail: "Demo inventory, not a current verified source.",
      checkedAt,
      hasOfficialLink: false,
      isVerified: false,
      isFixture: true,
      daysSinceCheck
    };
  }

  if (!trust.isVerified || exhibition.sourceFreshness !== "fresh") {
    return {
      kind: "needs-review",
      label: "Needs review",
      detail: trust.hasOfficialLink
        ? `Source checked ${formatFreshnessDate(checkedAt)}; re-review before featuring.`
        : "No official gallery link is ready.",
      checkedAt,
      hasOfficialLink: trust.hasOfficialLink,
      isVerified: false,
      isFixture: false,
      daysSinceCheck
    };
  }

  if (daysSinceCheck !== undefined && daysSinceCheck <= 14) {
    return {
      kind: "verified-recently",
      label: "Verified recently",
      detail: `Verified as of ${formatFreshnessDate(checkedAt)} from an official gallery link.`,
      checkedAt,
      hasOfficialLink: true,
      isVerified: true,
      isFixture: false,
      daysSinceCheck
    };
  }

  if (daysSinceCheck !== undefined && daysSinceCheck >= 30) {
    return {
      kind: "verified-aging",
      label: "Verified but aging",
      detail: `Verified as of ${formatFreshnessDate(checkedAt)}; schedule a source re-check.`,
      checkedAt,
      hasOfficialLink: true,
      isVerified: true,
      isFixture: false,
      daysSinceCheck
    };
  }

  return {
    kind: "verified",
    label: `Verified as of ${formatFreshnessDate(checkedAt)}`,
    detail: "Official gallery link is present; freshness date is visible.",
    checkedAt,
    hasOfficialLink: true,
    isVerified: true,
    isFixture: false,
    daysSinceCheck
  };
}

function createReviewItem(
  exhibition: GalleryExhibition,
  freshness: GalleryFreshnessState
): GalleryFreshnessReviewItem | undefined {
  const reasons: GalleryFreshnessReviewReason[] = [];

  if (freshness.kind === "fixture-demo") {
    reasons.push("fixture-demo");
  }

  if (freshness.kind === "verified-aging") {
    reasons.push("aging-verification");
  }

  if (freshness.kind === "needs-review") {
    if (exhibition.sourceFreshness === "stale-risk") {
      reasons.push("stale-source");
    } else {
      reasons.push("needs-review-source");
    }
  }

  if (!freshness.hasOfficialLink) {
    reasons.push("missing-official-link");
  }

  if (reasons.length === 0) {
    return undefined;
  }

  const priority =
    reasons.includes("stale-source") || reasons.includes("missing-official-link")
      ? "high"
      : reasons.includes("needs-review-source") || reasons.includes("fixture-demo")
        ? "medium"
        : "low";
  const actionLabel =
    freshness.kind === "fixture-demo"
      ? "Replace demo record"
      : freshness.kind === "verified-aging"
        ? "Re-check official page"
        : "Review source freshness";

  return {
    exhibitionId: exhibition.id,
    title: exhibition.title,
    galleryName: exhibition.galleryName,
    areaId: exhibition.areaId,
    neighborhood: exhibition.neighborhood,
    freshness,
    reasons,
    priority,
    actionLabel,
    officialUrl: freshness.hasOfficialLink ? exhibition.externalUrl : undefined
  };
}

export function createGalleryFreshnessReview(input: {
  areaId: GalleryAreaId;
  exhibitions: GalleryExhibition[];
  referenceNow: string;
  limit?: number;
}): GalleryFreshnessReviewItem[] {
  const priorityRank: Record<GalleryFreshnessReviewItem["priority"], number> = {
    high: 0,
    medium: 1,
    low: 2
  };

  return input.exhibitions
    .filter((exhibition) => exhibition.areaId === input.areaId)
    .map((exhibition) =>
      createReviewItem(exhibition, getGalleryFreshnessState(exhibition, input.referenceNow))
    )
    .filter((item): item is GalleryFreshnessReviewItem => Boolean(item))
    .sort((left, right) => {
      const priorityDelta = priorityRank[left.priority] - priorityRank[right.priority];

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return (
        (right.freshness.daysSinceCheck ?? 0) - (left.freshness.daysSinceCheck ?? 0) ||
        left.galleryName.localeCompare(right.galleryName)
      );
    })
    .slice(0, input.limit ?? 5);
}

export function createGalleryFreshnessAudit(input: {
  areaId: GalleryAreaId;
  exhibitions: GalleryExhibition[];
  referenceNow: string;
}): GalleryFreshnessSummary {
  const marketExhibitions = input.exhibitions.filter(
    (exhibition) => exhibition.areaId === input.areaId
  );
  const states = marketExhibitions.map((exhibition) =>
    getGalleryFreshnessState(exhibition, input.referenceNow)
  );
  const verifiedRecentlyCount = states.filter((state) => state.kind === "verified-recently").length;
  const verifiedCount = states.filter((state) => state.isVerified).length;
  const verifiedAgingCount = states.filter((state) => state.kind === "verified-aging").length;
  const needsReviewCount = states.filter((state) => state.kind === "needs-review").length;
  const fixtureDemoCount = states.filter((state) => state.kind === "fixture-demo").length;
  const officialLinkCount = states.filter((state) => state.hasOfficialLink).length;
  const needsReviewNext = createGalleryFreshnessReview({
    ...input,
    limit: 5
  });
  const totalCount = states.length;
  const summaryLabel =
    verifiedCount >= 30 && input.areaId === "nyc"
      ? "Strong verified walk supply"
      : verifiedCount >= 6
        ? "Verified walk supply"
        : "Thin verified supply";
  const nextAction =
    fixtureDemoCount > 0
      ? "Replace demo listings with official-page checks next."
      : needsReviewCount > 0
        ? "Re-check needs-review listings before promotion."
        : "Keep source dates moving with manual checks.";

  return {
    areaId: input.areaId,
    totalCount,
    verifiedRecentlyCount,
    verifiedCount,
    verifiedAgingCount,
    needsReviewCount,
    fixtureDemoCount,
    officialLinkCount,
    needsReviewNext,
    summaryLabel,
    nextAction
  };
}
