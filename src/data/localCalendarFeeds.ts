export type LocalCalendarSourceKind = "ics" | "rss" | "html-calendar" | "manual-import";

export type LocalCalendarEvent = {
  calendarId: string;
  sourceKind: LocalCalendarSourceKind;
  sourceUrl: string;
  externalId: string;
  title: string;
  presenter: string;
  taxonomy: string[];
  startsAt: string;
  venueName: string;
  neighborhood: string;
  areaId: string;
  distanceMiles: number;
  description: string;
  tags: string[];
  imageTone: string;
  ticketUrl?: string;
  priceCents?: number;
  listPriceCents?: number;
  remainingEstimate?: number;
  maxQuantity?: number;
  dealLabel?: string;
  dealDescription?: string;
  dealExpiresAt?: string;
  amountOffCents?: number;
  recommendationSignals?: string[];
};

export const localCalendarEvents: LocalCalendarEvent[] = [
  {
    calendarId: "hudson-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://example.com/hudson-arts-calendar",
    externalId: "hac-101",
    title: "Riverside Listening Room",
    presenter: "Hudson Valley Song Circle",
    taxonomy: ["music", "concert", "folk"],
    startsAt: "2026-07-10T20:00:00-04:00",
    venueName: "River Hall",
    neighborhood: "Warren Street",
    areaId: "hudson",
    distanceMiles: 0.4,
    description: "A small-room singer-songwriter night pulled from a regional arts calendar.",
    tags: ["listening room", "regional artists", "weekend"],
    imageTone: "#4A6B5F",
    ticketUrl: "https://example.com/hudson-arts-calendar/hac-101",
    priceCents: 2800,
    listPriceCents: 3500,
    remainingEstimate: 18,
    maxQuantity: 6,
    dealLabel: "Calendar preview",
    dealDescription: "Small-market preview allocation surfaced from a reusable local calendar feed.",
    dealExpiresAt: "2026-07-10T18:30:00-04:00",
    amountOffCents: 700,
    recommendationSignals: ["category:concert", "category:folk"]
  },
  {
    calendarId: "hudson-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://example.com/hudson-arts-calendar",
    externalId: "hac-102",
    title: "Warehouse Movement Studies",
    presenter: "North River Dance Lab",
    taxonomy: ["dance", "performance"],
    startsAt: "2026-07-12T16:00:00-04:00",
    venueName: "Foundry Studio",
    neighborhood: "Waterfront",
    areaId: "hudson",
    distanceMiles: 0.8,
    description: "An afternoon dance showing discovered through a reusable regional calendar source.",
    tags: ["contemporary dance", "studio showing", "matinee"],
    imageTone: "#0D7C75",
    ticketUrl: "https://example.com/hudson-arts-calendar/hac-102",
    priceCents: 2200,
    remainingEstimate: 24,
    maxQuantity: 4,
    recommendationSignals: ["category:dance"]
  }
];
