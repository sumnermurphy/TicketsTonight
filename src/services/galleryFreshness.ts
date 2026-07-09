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
  sourceReceiptSummary: GallerySourceReceiptSummary;
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

export type GallerySourceReceiptKind =
  | "official-verified"
  | "official-needs-review"
  | "partner-submitted"
  | "manual-review"
  | "fixture-demo";

export type GallerySourceReceipt = {
  exhibitionId: string;
  kind: GallerySourceReceiptKind;
  label: string;
  evidenceLabel: string;
  checkedLabel: string;
  detail: string;
  actionLabel: string;
  officialUrl?: string;
  checkedAt?: string;
  hasOfficialEvidence: boolean;
  needsReview: boolean;
};

export type GallerySourceReceiptSummary = {
  areaId: GalleryAreaId;
  totalCount: number;
  officialReceiptCount: number;
  verifiedReceiptCount: number;
  needsReviewCount: number;
  fixtureDemoCount: number;
  partnerSubmittedCount: number;
  manualReviewCount: number;
  summaryLabel: string;
};

export type GalleryFreshnessReviewItem = {
  exhibitionId: string;
  title: string;
  galleryName: string;
  areaId: GalleryAreaId;
  neighborhood: string;
  freshness: GalleryFreshnessState;
  receipt: GallerySourceReceipt;
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

export function createGallerySourceReceipt(
  exhibition: GalleryExhibition,
  referenceNow: string,
  freshnessState = getGalleryFreshnessState(exhibition, referenceNow)
): GallerySourceReceipt {
  const trust = getGalleryInventoryTrust(exhibition);
  const checkedAt = freshnessState.checkedAt;
  const formattedDate = formatFreshnessDate(checkedAt);
  const hasOfficialEvidence = trust.hasOfficialLink && exhibition.sourceLegalStatus === "official-public-page";

  if (trust.isFixture) {
    return {
      exhibitionId: exhibition.id,
      kind: "fixture-demo",
      label: "Fixture/demo",
      evidenceLabel: "Demo inventory",
      checkedLabel: "No current source check",
      detail: "Seeded demo record; do not treat as a verified current exhibition.",
      actionLabel: "Replace with official page",
      checkedAt,
      hasOfficialEvidence: false,
      needsReview: true
    };
  }

  if (trust.isVerified) {
    return {
      exhibitionId: exhibition.id,
      kind: "official-verified",
      label: `Official page checked ${formattedDate}`,
      evidenceLabel: "Verified from gallery page",
      checkedLabel: `Verified as of ${formattedDate}`,
      detail:
        freshnessState.kind === "verified-aging"
          ? "Official gallery link is present, but the source date should be refreshed soon."
          : "Official gallery link and manual verification date are present.",
      actionLabel: "Open official link",
      officialUrl: exhibition.externalUrl,
      checkedAt,
      hasOfficialEvidence: true,
      needsReview: freshnessState.kind === "verified-aging"
    };
  }

  if (exhibition.sourceLegalStatus === "partner-submission") {
    return {
      exhibitionId: exhibition.id,
      kind: "partner-submitted",
      label: checkedAt ? `Submitted source checked ${formattedDate}` : "Partner/submitted",
      evidenceLabel: "Submitted listing",
      checkedLabel: checkedAt ? `Source checked ${formattedDate}` : "Awaiting source check",
      detail: "Submitted inventory needs review before being promoted as verified.",
      actionLabel: "Review submission",
      officialUrl: trust.hasOfficialLink ? exhibition.externalUrl : undefined,
      checkedAt,
      hasOfficialEvidence: false,
      needsReview: true
    };
  }

  if (hasOfficialEvidence) {
    return {
      exhibitionId: exhibition.id,
      kind: "official-needs-review",
      label: `Official link needs review`,
      evidenceLabel: "Official link present",
      checkedLabel: checkedAt ? `Source checked ${formattedDate}` : "Source date missing",
      detail: "Official link exists, but freshness or verification status is not strong enough to feature.",
      actionLabel: "Re-check official page",
      officialUrl: exhibition.externalUrl,
      checkedAt,
      hasOfficialEvidence: true,
      needsReview: true
    };
  }

  return {
    exhibitionId: exhibition.id,
    kind: "manual-review",
    label: "Needs review",
    evidenceLabel: "Manual review needed",
    checkedLabel: checkedAt ? `Source checked ${formattedDate}` : "Source date missing",
    detail: "This record is not backed by a current official gallery page yet.",
    actionLabel: "Add official evidence",
    officialUrl: trust.hasOfficialLink ? exhibition.externalUrl : undefined,
    checkedAt,
    hasOfficialEvidence: false,
    needsReview: true
  };
}

export function createGallerySourceReceiptSummary(input: {
  areaId: GalleryAreaId;
  exhibitions: GalleryExhibition[];
  referenceNow: string;
}): GallerySourceReceiptSummary {
  const receipts = input.exhibitions
    .filter((exhibition) => exhibition.areaId === input.areaId)
    .map((exhibition) => createGallerySourceReceipt(exhibition, input.referenceNow));
  const verifiedReceiptCount = receipts.filter((receipt) => receipt.kind === "official-verified").length;
  const needsReviewCount = receipts.filter((receipt) => receipt.needsReview).length;
  const fixtureDemoCount = receipts.filter((receipt) => receipt.kind === "fixture-demo").length;
  const partnerSubmittedCount = receipts.filter((receipt) => receipt.kind === "partner-submitted").length;
  const manualReviewCount = receipts.filter((receipt) => receipt.kind === "manual-review").length;
  const officialReceiptCount = receipts.filter((receipt) => receipt.hasOfficialEvidence).length;

  return {
    areaId: input.areaId,
    totalCount: receipts.length,
    officialReceiptCount,
    verifiedReceiptCount,
    needsReviewCount,
    fixtureDemoCount,
    partnerSubmittedCount,
    manualReviewCount,
    summaryLabel:
      verifiedReceiptCount >= 30 && input.areaId === "nyc"
        ? "Review-ready source receipts"
        : verifiedReceiptCount >= 6
          ? "Useful source receipts"
          : "Thin receipt coverage"
  };
}

function createReviewItem(
  exhibition: GalleryExhibition,
  freshness: GalleryFreshnessState,
  referenceNow: string
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
  const receipt = createGallerySourceReceipt(exhibition, referenceNow, freshness);

  return {
    exhibitionId: exhibition.id,
    title: exhibition.title,
    galleryName: exhibition.galleryName,
    areaId: exhibition.areaId,
    neighborhood: exhibition.neighborhood,
    freshness,
    receipt,
    reasons,
    priority,
    actionLabel,
    officialUrl: receipt.officialUrl
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
      createReviewItem(
        exhibition,
        getGalleryFreshnessState(exhibition, input.referenceNow),
        input.referenceNow
      )
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
  const sourceReceiptSummary = createGallerySourceReceiptSummary(input);
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
    sourceReceiptSummary,
    needsReviewNext,
    summaryLabel,
    nextAction
  };
}
