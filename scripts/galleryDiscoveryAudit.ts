import { galleryAreas, galleryExhibitions } from "../src/data/galleryCatalog";
import {
  createGallerySourceTrustSummary,
  createGalleryWalkPlan,
  createNeighborhoodIntelligence,
  getLastChanceGalleryAlerts
} from "../src/services/galleryDiscovery";

const referenceNow = "2026-07-09T15:30:00-04:00";

for (const area of galleryAreas) {
  const trust = createGallerySourceTrustSummary(area.id, galleryExhibitions, referenceNow);
  const neighborhoods = createNeighborhoodIntelligence(area.id, galleryExhibitions, referenceNow);
  const defaultNeighborhood =
    neighborhoods.find((neighborhood) => neighborhood.canSupportWalk)?.neighborhood ??
    neighborhoods[0]?.neighborhood;
  const quickWalk = createGalleryWalkPlan({
    areaId: area.id,
    mode: "quick-loop",
    neighborhood: defaultNeighborhood,
    referenceNow
  });
  const openingWalk = createGalleryWalkPlan({
    areaId: area.id,
    mode: "opening-night",
    referenceNow
  });
  const lastChanceAlerts = getLastChanceGalleryAlerts(galleryExhibitions, {
    areaId: area.id,
    days: 14,
    referenceNow
  });

  console.log(`\n${area.name} (${area.role})`);
  console.log(
    `Inventory: ${trust.exhibitionCount} exhibitions, ${trust.openingCount} opening/social events tonight`
  );
  console.log(
    `Coverage: hours ${trust.hoursCoveragePercent}%, addresses ${trust.addressCoveragePercent}%, links ${trust.externalLinkCoveragePercent}%`
  );
  console.log(
    `Freshness: ${trust.freshSourceCount} fresh, ${trust.staleSourceRiskCount} stale-risk, ${trust.officialOrSubmissionCount} official/submission-safe`
  );
  console.log(`Next action: ${trust.recommendedNextAction}`);
  console.log(
    `Walk-ready neighborhoods: ${
      neighborhoods
        .filter((neighborhood) => neighborhood.canSupportWalk)
        .map((neighborhood) => neighborhood.neighborhood)
        .join(", ") || "none yet"
    }`
  );
  console.log(`Quick walk: ${quickWalk.summary}`);
  console.log(`Opening crawl: ${openingWalk.summary}`);
  console.log(`Last-chance alerts: ${lastChanceAlerts.length}`);
}
