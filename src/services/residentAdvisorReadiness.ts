export type ResidentAdvisorMarketReadiness = {
  areaId: string;
  status: "strong-candidate" | "watchlist" | "low-fit";
  availability: string;
  eventCategoryFit: string;
  ticketLinkReadiness: string;
  legalPartnerPath: string;
  recommendation: string;
  referenceUrls: string[];
};

export const residentAdvisorReadiness: ResidentAdvisorMarketReadiness[] = [
  {
    areaId: "nyc",
    status: "strong-candidate",
    availability:
      "Strong category fit for New York nightlife, but the exact RA market URL/API or partner access path still needs confirmation.",
    eventCategoryFit: "Strong fit for DJ sets, club nights, parties, promoters, and electronic live music.",
    ticketLinkReadiness: "Potentially useful for external ticket links, pending permission or partner/API access.",
    legalPartnerPath:
      "RA terms restrict automated extraction and unauthorised scripts, bots, crawlers, or scrapers.",
    recommendation:
      "Prioritize RA as a partner/API candidate before building any production ingestion.",
    referenceUrls: ["https://ra.co/events", "https://ra.co/terms"]
  },
  {
    areaId: "la",
    status: "strong-candidate",
    availability:
      "Public RA Los Angeles event pages show a high-volume nightlife market with hundreds of upcoming events.",
    eventCategoryFit: "Strong fit for DJ sets, warehouse parties, club nights, and electronic promoters.",
    ticketLinkReadiness: "Potentially useful for external ticket links, pending permission or partner/API access.",
    legalPartnerPath:
      "RA terms restrict automated extraction and unauthorised scripts, bots, crawlers, or scrapers.",
    recommendation:
      "Prioritize RA as a partner/API candidate for LA nightlife after discovery quality is stable.",
    referenceUrls: ["https://ra.co/events/us/losangeles", "https://ra.co/terms"]
  },
  {
    areaId: "hudson",
    status: "low-fit",
    availability: "No first-class Hudson, NY RA market path is confirmed for this slice.",
    eventCategoryFit: "Low immediate fit; Hudson discovery should stay local-calendar-led.",
    ticketLinkReadiness: "Not ready for Hudson ticket-link expansion without manual market validation.",
    legalPartnerPath:
      "RA terms restrict automated extraction and unauthorised scripts, bots, crawlers, or scrapers.",
    recommendation:
      "Do not use RA for Hudson v1; revisit only if nearby electronic listings prove material.",
    referenceUrls: ["https://ra.co/terms"]
  }
];

export function getResidentAdvisorReadiness(areaId: string): ResidentAdvisorMarketReadiness {
  return (
    residentAdvisorReadiness.find((readiness) => readiness.areaId === areaId) ??
    residentAdvisorReadiness[0]!
  );
}
