import type { ShowCategory } from "../types";

export type LocalCalendarSourceKind = "ics" | "rss" | "html-calendar" | "manual-import";

export type LocalCalendarPipelineStatus = "fixture-backed" | "parser-ready";

export type LocalCalendarParserMode = "auto" | "json-ld" | "event-list";

export type LocalCalendarLegalStatus =
  | "public-calendar-review"
  | "partner-permission-required"
  | "blocked";

export type LocalCalendarParserProfile = {
  mode: LocalCalendarParserMode;
  legalStatus: LocalCalendarLegalStatus;
  sourceShape: string;
  defaultVenueName?: string;
  defaultNeighborhood?: string;
  defaultDistanceMiles?: number;
  defaultImageTone?: string;
  defaultTags?: string[];
  defaultTaxonomy?: string[];
  externalIdPrefix?: string;
  linkBaseUrl?: string;
};

export type LocalCalendarSource = {
  id: string;
  label: string;
  areaId: string;
  sourceKind: LocalCalendarSourceKind;
  sourceUrl: string;
  categories: ShowCategory[];
  status: LocalCalendarPipelineStatus;
  parserNotes: string;
  exampleExternalIds: string[];
  parserProfile?: LocalCalendarParserProfile;
};

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

export const localCalendarSources: LocalCalendarSource[] = [
  {
    id: "nyc-performing-arts-calendar",
    label: "NYC performing arts calendar",
    areaId: "nyc",
    sourceKind: "html-calendar",
    sourceUrl: "https://www.joyce.org/performances",
    categories: ["dance", "ballet", "opera"],
    status: "fixture-backed",
    parserNotes:
      "Use the shared HTML-calendar normalizer for event pages with date rows, buy-link anchors, venue names, and category hints before adding venue-specific adapters.",
    exampleExternalIds: ["nyc-pa-101", "nyc-pa-102", "nyc-pa-103", "nyc-pa-104"],
    parserProfile: {
      mode: "auto",
      legalStatus: "public-calendar-review",
      sourceShape:
        "Performing-arts event pages and list rows with titles, performance dates, venues, and buy-link anchors.",
      defaultNeighborhood: "Chelsea",
      defaultDistanceMiles: 1.8,
      defaultImageTone: "#246A73",
      defaultTags: ["performing arts"],
      defaultTaxonomy: ["dance"],
      externalIdPrefix: "nycpa"
    }
  },
  {
    id: "hudson-arts-calendar",
    label: "Hudson regional arts calendar",
    areaId: "hudson",
    sourceKind: "html-calendar",
    sourceUrl: "https://hudsonhall.org/events/",
    categories: ["concert", "dance", "opera", "play", "theater", "variety"],
    status: "parser-ready",
    parserNotes:
      "Start with one regional calendar parser for list pages, event detail URLs, category filters, and price/free-ticket copy; only add venue-specific adapters after measured gaps remain.",
    exampleExternalIds: ["hac-101", "hac-102", "hac-103", "hac-104", "hac-105", "hac-106"],
    parserProfile: {
      mode: "auto",
      legalStatus: "public-calendar-review",
      sourceShape:
        "Hudson Hall pages expose JSON-LD event blocks plus public event links and price/free-ticket copy.",
      defaultVenueName: "Hudson Hall",
      defaultNeighborhood: "Warren Street",
      defaultDistanceMiles: 0.4,
      defaultImageTone: "#4A6B5F",
      defaultTags: ["regional calendar"],
      defaultTaxonomy: ["concert"],
      externalIdPrefix: "hudsonhall"
    }
  },
  {
    id: "hudson-fisher-center-calendar",
    label: "Fisher Center / Bard SummerScape calendar",
    areaId: "hudson",
    sourceKind: "html-calendar",
    sourceUrl: "https://fishercenter.bard.edu/whats-on/",
    categories: ["concert", "opera", "theater", "variety"],
    status: "parser-ready",
    parserNotes:
      "Public event pages expose titles, date blocks, venue/location, ticketing copy, and Buy Tickets links; use as a regional performing-arts parser candidate after legal review.",
    exampleExternalIds: [
      "fisher-2026-egyptian-helen",
      "fisher-2026-mozart-program-one",
      "fisher-2026-abduction-seraglio"
    ],
    parserProfile: {
      mode: "event-list",
      legalStatus: "public-calendar-review",
      sourceShape:
        "What’s On list rows expose title, date text, venue/series labels, detail links, and a site-level Buy Tickets path.",
      defaultVenueName: "Fisher Center",
      defaultNeighborhood: "Annandale-on-Hudson",
      defaultDistanceMiles: 8.8,
      defaultImageTone: "#514066",
      defaultTags: ["regional performing arts"],
      defaultTaxonomy: ["concert", "classical"],
      externalIdPrefix: "fisher",
      linkBaseUrl: "https://fishercenter.bard.edu"
    }
  },
  {
    id: "hudson-basilica-calendar",
    label: "Basilica Hudson events calendar",
    areaId: "hudson",
    sourceKind: "html-calendar",
    sourceUrl: "https://basilicahudson.org/events/",
    categories: ["concert", "dj", "variety"],
    status: "parser-ready",
    parserNotes:
      "Public event index exposes upcoming event dates and detail links; use as a Hudson music and electronic-adjacent calendar candidate before bespoke venue adapters.",
    exampleExternalIds: [
      "basilica-2026-wednesday",
      "basilica-2026-houndmouth",
      "basilica-2026-boy-harsher"
    ],
    parserProfile: {
      mode: "event-list",
      legalStatus: "public-calendar-review",
      sourceShape:
        "Upcoming Events list exposes dates, titles, and public event detail links for concert/electronic programming.",
      defaultVenueName: "Basilica Hudson",
      defaultNeighborhood: "South Front Street",
      defaultDistanceMiles: 0.9,
      defaultImageTone: "#334E4B",
      defaultTags: ["basilica hudson", "regional music"],
      defaultTaxonomy: ["concert"],
      externalIdPrefix: "basilica",
      linkBaseUrl: "https://basilicahudson.org"
    }
  },
  {
    id: "la-performing-arts-calendar",
    label: "LA performing arts calendars",
    areaId: "la",
    sourceKind: "html-calendar",
    sourceUrl: "https://www.laopera.org/performances/",
    categories: ["dance", "opera", "play", "theater", "variety"],
    status: "parser-ready",
    parserNotes:
      "LA Opera and Music Center-style pages expose upcoming show cards with detail links; use the reusable list importer before venue-direct one-offs.",
    exampleExternalIds: ["laopera-cosi-fan-tutte", "laopera-ainadamar"],
    parserProfile: {
      mode: "event-list",
      legalStatus: "public-calendar-review",
      sourceShape:
        "Upcoming-shows pages expose title/detail links and show-level date pages; ticket paths need source health validation before production ingestion.",
      defaultVenueName: "LA Opera",
      defaultNeighborhood: "Downtown",
      defaultDistanceMiles: 1.5,
      defaultImageTone: "#67597A",
      defaultTags: ["performing arts", "opera"],
      defaultTaxonomy: ["opera"],
      externalIdPrefix: "laopera",
      linkBaseUrl: "https://www.laopera.org"
    }
  }
];

export const localCalendarEvents: LocalCalendarEvent[] = [
  {
    calendarId: "nyc-performing-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://www.joyce.org/performances",
    externalId: "nyc-pa-101",
    title: "Pilobolus: Trips",
    presenter: "Pilobolus",
    taxonomy: ["dance", "contemporary dance"],
    startsAt: "2026-07-10T19:30:00-04:00",
    venueName: "The Joyce Theater",
    neighborhood: "Chelsea",
    areaId: "nyc",
    distanceMiles: 1.8,
    description:
      "A Joyce Theater calendar listing for Pilobolus, useful for exercising date-row parsing and ticket-link preservation.",
    tags: ["contemporary dance", "physical theater", "kinetic"],
    imageTone: "#246A73",
    ticketUrl: "https://www.joyce.org/performances/pilobolus-n86f",
    remainingEstimate: 16,
    maxQuantity: 4,
    recommendationSignals: ["category:dance", "spotify:contemporary-dance"]
  },
  {
    calendarId: "nyc-performing-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://www.joyce.org/performances",
    externalId: "nyc-pa-102",
    title: "Ballet Festival",
    presenter: "The Joyce Theater",
    taxonomy: ["ballet", "dance"],
    startsAt: "2026-08-04T19:30:00-04:00",
    venueName: "The Joyce Theater",
    neighborhood: "Chelsea",
    areaId: "nyc",
    distanceMiles: 1.8,
    description:
      "A ballet calendar fixture that keeps NYC performing-arts discovery populated from a reusable calendar source.",
    tags: ["ballet", "festival", "dance"],
    imageTone: "#67597A",
    ticketUrl: "https://www.joyce.org/performances/ballet-festival-rg17",
    priceCents: 5800,
    remainingEstimate: 22,
    maxQuantity: 4,
    recommendationSignals: ["category:ballet", "spotify:ballet"]
  },
  {
    calendarId: "nyc-performing-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://www.metopera.org/",
    externalId: "nyc-pa-103",
    title: "Macbeth",
    presenter: "The Metropolitan Opera",
    taxonomy: ["opera", "classical", "verdi"],
    startsAt: "2026-09-22T18:30:00-04:00",
    venueName: "Metropolitan Opera House",
    neighborhood: "Lincoln Center",
    areaId: "nyc",
    distanceMiles: 3.2,
    description:
      "A Met Opera event page fixture that proves the calendar path can carry opera listings and public ticket links.",
    tags: ["opera", "verdi", "lincoln center"],
    imageTone: "#8A3FFC",
    ticketUrl: "https://www.metopera.org/season/2026-27-season/macbeth/",
    priceCents: 3500,
    remainingEstimate: 40,
    maxQuantity: 4,
    recommendationSignals: ["category:opera", "spotify:opera", "spotify:classical"]
  },
  {
    calendarId: "nyc-performing-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://www.nycballet.com/season-and-tickets/seasons",
    externalId: "nyc-pa-104",
    title: "Jewels",
    presenter: "New York City Ballet",
    taxonomy: ["ballet", "dance"],
    startsAt: "2026-09-22T19:30:00-04:00",
    venueName: "David H. Koch Theater",
    neighborhood: "Lincoln Center",
    areaId: "nyc",
    distanceMiles: 3.1,
    description:
      "A New York City Ballet season listing that exercises on-sale metadata and a reusable ballet calendar source.",
    tags: ["ballet", "balanchine", "lincoln center"],
    imageTone: "#C65D2E",
    ticketUrl: "https://www.nycballet.com/season-and-tickets/fall-2026/jewels",
    remainingEstimate: 32,
    maxQuantity: 4,
    recommendationSignals: ["category:ballet", "spotify:ballet", "spotify:classical"]
  },
  {
    calendarId: "hudson-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://hudsonhall.org/events/",
    externalId: "hac-101",
    title: "Ruckus: The Edinburgh Rollick",
    presenter: "Ruckus",
    taxonomy: ["music", "concert", "folk baroque"],
    startsAt: "2026-07-29T18:00:00-04:00",
    venueName: "Hudson Hall",
    neighborhood: "Warren Street",
    areaId: "hudson",
    distanceMiles: 0.4,
    description:
      "A regional calendar listing for Ruckus at Hudson Hall, including a real event page.",
    tags: ["folk baroque", "waterfront", "regional artists"],
    imageTone: "#4A6B5F",
    ticketUrl: "https://hudsonhall.org/event/ruckus/",
    priceCents: 0,
    remainingEstimate: 18,
    maxQuantity: 6,
    dealLabel: "Free concert",
    dealDescription: "Free concert surfaced from a reusable local calendar feed.",
    dealExpiresAt: "2026-07-29T12:00:00-04:00",
    recommendationSignals: ["category:concert", "spotify:folk", "spotify:baroque"]
  },
  {
    calendarId: "hudson-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://hudsonhall.org/events/",
    externalId: "hac-102",
    title: "Midsummer Swing!",
    presenter: "Hudson Hall",
    taxonomy: ["dance", "live music", "swing"],
    startsAt: "2026-07-25T18:30:00-04:00",
    venueName: "Hudson Hall",
    neighborhood: "Warren Street",
    areaId: "hudson",
    distanceMiles: 0.4,
    description:
      "A Hudson Hall dance-and-live-music listing used to test dance category parsing from a regional calendar.",
    tags: ["swing dance", "live music", "lesson"],
    imageTone: "#0D7C75",
    ticketUrl: "https://hudsonhall.org/event/midsummer-swing/",
    priceCents: 4200,
    remainingEstimate: 24,
    maxQuantity: 4,
    recommendationSignals: ["category:dance", "spotify:swing"]
  },
  {
    calendarId: "hudson-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://hudsonhall.org/events/",
    externalId: "hac-103",
    title: "Handel Sets Sail",
    presenter: "Hudson Hall",
    taxonomy: ["opera", "classical", "handel"],
    startsAt: "2026-07-11T18:00:00-04:00",
    venueName: "Schooner Apollonia",
    neighborhood: "Waterfront",
    areaId: "hudson",
    distanceMiles: 0.8,
    description:
      "An opera-series calendar listing that proves the small-market feed path can carry classical and opera inventory.",
    tags: ["opera", "handel", "waterfront"],
    imageTone: "#36558F",
    ticketUrl: "https://hudsonhall.org/event/handel-sets-sail-3/",
    priceCents: 6500,
    remainingEstimate: 12,
    maxQuantity: 2,
    recommendationSignals: ["category:opera", "spotify:opera", "spotify:classical"]
  },
  {
    calendarId: "hudson-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://hudsonhall.org/events?_sfm_event_category=theater",
    externalId: "hac-104",
    title: "Regional Play Calendar Slot",
    presenter: "Hudson Valley Theater Calendar",
    taxonomy: ["play", "theater"],
    startsAt: "2026-07-18T19:30:00-04:00",
    venueName: "Regional Black Box",
    neighborhood: "Warren Street",
    areaId: "hudson",
    distanceMiles: 0.6,
    description:
      "A parser-ready play fixture for a regional theater calendar filter, kept generic until a venue feed is measured as worth a bespoke adapter.",
    tags: ["new play", "regional theater", "black box"],
    imageTone: "#6C4F3D",
    ticketUrl: "https://hudsonhall.org/events?_sfm_event_category=theater",
    remainingEstimate: 20,
    maxQuantity: 4,
    recommendationSignals: ["category:play", "spotify:theater"]
  },
  {
    calendarId: "hudson-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://hudsonhall.org/events?_sfm_event_category=theater",
    externalId: "hac-105",
    title: "Regional Theater Calendar Slot",
    presenter: "Hudson Valley Theater Calendar",
    taxonomy: ["theater", "performance"],
    startsAt: "2026-07-19T15:00:00-04:00",
    venueName: "Regional Black Box",
    neighborhood: "Warren Street",
    areaId: "hudson",
    distanceMiles: 0.6,
    description:
      "A parser-ready theater fixture that keeps Hudson's calendar lane category-complete without adding one-off venue code.",
    tags: ["theater", "performance", "regional arts"],
    imageTone: "#7A4057",
    ticketUrl: "https://hudsonhall.org/events?_sfm_event_category=theater",
    remainingEstimate: 18,
    maxQuantity: 4,
    recommendationSignals: ["category:theater", "spotify:theater"]
  },
  {
    calendarId: "hudson-arts-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://hudsonhall.org/events?_sfm_event_category=special-events",
    externalId: "hac-106",
    title: "Surface, Structure, String",
    presenter: "Hudson Hall",
    taxonomy: ["variety", "exhibition", "special event"],
    startsAt: "2026-07-12T12:00:00-04:00",
    venueName: "Hudson Hall",
    neighborhood: "Warren Street",
    areaId: "hudson",
    distanceMiles: 0.4,
    description:
      "A Hudson Hall exhibition listing that exercises adjacent-live discovery for the regional arts calendar.",
    tags: ["exhibition", "textile art", "special event"],
    imageTone: "#8A6F2A",
    ticketUrl: "https://hudsonhall.org/event/surface-structure-string/",
    remainingEstimate: 40,
    maxQuantity: 4,
    recommendationSignals: ["category:variety"]
  },
  {
    calendarId: "hudson-fisher-center-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://fishercenter.bard.edu/whats-on/",
    externalId: "fisher-2026-egyptian-helen",
    title: "The Egyptian Helen",
    presenter: "Bard SummerScape",
    taxonomy: ["opera", "richard strauss", "summerscape"],
    startsAt: "2026-07-24T18:30:00-04:00",
    venueName: "Fisher Center, Sosnoff Theater",
    neighborhood: "Annandale-on-Hudson",
    areaId: "hudson",
    distanceMiles: 8.8,
    description:
      "A Fisher Center SummerScape opera listing with ticketing copy, event detail dates, and a public Buy Tickets path.",
    tags: ["opera", "summerscape", "regional performing arts"],
    imageTone: "#514066",
    ticketUrl: "https://fishercenter.bard.edu/series/the-egyptian-helen/",
    priceCents: 2500,
    remainingEstimate: 28,
    maxQuantity: 4,
    recommendationSignals: ["category:opera", "spotify:opera", "spotify:classical"]
  },
  {
    calendarId: "hudson-fisher-center-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://fishercenter.bard.edu/whats-on/",
    externalId: "fisher-2026-mozart-program-one",
    title: "Program One: The Many Facets of Mozart",
    presenter: "Bard Music Festival",
    taxonomy: ["concert", "bard music festival", "mozart"],
    startsAt: "2026-08-07T19:00:00-04:00",
    venueName: "Fisher Center, Sosnoff Theater",
    neighborhood: "Annandale-on-Hudson",
    areaId: "hudson",
    distanceMiles: 8.8,
    description:
      "A Bard Music Festival concert listing with commentary, ticketing copy, and a public Buy Tickets path.",
    tags: ["mozart", "festival", "classical"],
    imageTone: "#2F5D62",
    ticketUrl: "https://fishercenter.bard.edu/events/bmf26-p1/",
    priceCents: 2500,
    remainingEstimate: 30,
    maxQuantity: 4,
    recommendationSignals: ["category:concert", "spotify:classical", "spotify:mozart"]
  },
  {
    calendarId: "hudson-fisher-center-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://fishercenter.bard.edu/whats-on/",
    externalId: "fisher-2026-abduction-seraglio",
    title: "Mozart's Abduction from the Seraglio",
    presenter: "Bard Music Festival",
    taxonomy: ["opera", "mozart", "bard music festival"],
    startsAt: "2026-08-16T15:00:00-04:00",
    venueName: "Fisher Center, Sosnoff Theater",
    neighborhood: "Annandale-on-Hudson",
    areaId: "hudson",
    distanceMiles: 8.8,
    description:
      "A Bard Music Festival opera program with public event details, ticketing copy, and a Buy Tickets path.",
    tags: ["mozart", "opera", "festival"],
    imageTone: "#755C1B",
    ticketUrl: "https://fishercenter.bard.edu/events/bmf26-p11/",
    priceCents: 2500,
    remainingEstimate: 26,
    maxQuantity: 4,
    recommendationSignals: ["category:opera", "spotify:opera", "spotify:classical"]
  },
  {
    calendarId: "hudson-basilica-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://basilicahudson.org/events/",
    externalId: "basilica-2026-wednesday",
    title: "WEDNESDAY",
    presenter: "Basilica Hudson",
    taxonomy: ["concert", "rock"],
    startsAt: "2026-07-22T20:00:00-04:00",
    venueName: "Basilica Hudson",
    neighborhood: "South Front Street",
    areaId: "hudson",
    distanceMiles: 0.9,
    description:
      "A Basilica Hudson upcoming-event listing for July 22, preserved as a link-ready local calendar fixture.",
    tags: ["indie rock", "basilica hudson", "regional music"],
    imageTone: "#334E4B",
    ticketUrl: "https://basilicahudson.org/events/wednesday/",
    remainingEstimate: 24,
    maxQuantity: 4,
    recommendationSignals: ["category:concert", "spotify:indie-rock"]
  },
  {
    calendarId: "hudson-basilica-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://basilicahudson.org/events/",
    externalId: "basilica-2026-houndmouth",
    title: "HOUNDMOUTH",
    presenter: "Basilica Hudson",
    taxonomy: ["concert", "rock"],
    startsAt: "2026-08-04T20:00:00-04:00",
    venueName: "Basilica Hudson",
    neighborhood: "South Front Street",
    areaId: "hudson",
    distanceMiles: 0.9,
    description:
      "A Basilica Hudson upcoming-event listing for August 4, preserved as a link-ready local calendar fixture.",
    tags: ["rock", "basilica hudson", "regional music"],
    imageTone: "#7A3F38",
    ticketUrl: "https://basilicahudson.org/events/houndmouth/",
    remainingEstimate: 28,
    maxQuantity: 4,
    recommendationSignals: ["category:concert", "spotify:rock"]
  },
  {
    calendarId: "hudson-basilica-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://basilicahudson.org/events/",
    externalId: "basilica-2026-boy-harsher",
    title: "Soundscape Presents: Boy Harsher",
    presenter: "Basilica Hudson",
    taxonomy: ["electronic", "concert", "darkwave"],
    startsAt: "2026-09-25T20:00:00-04:00",
    venueName: "Basilica Hudson",
    neighborhood: "South Front Street",
    areaId: "hudson",
    distanceMiles: 0.9,
    description:
      "A Basilica Hudson upcoming-event listing for September 25 that adds electronic-adjacent music to Hudson discovery.",
    tags: ["electronic", "darkwave", "basilica hudson"],
    imageTone: "#4A355A",
    ticketUrl: "https://basilicahudson.org/events/soundscape-presents-boy-harsher/",
    remainingEstimate: 26,
    maxQuantity: 4,
    recommendationSignals: ["category:dj", "spotify:electronic", "spotify:darkwave"]
  },
  {
    calendarId: "hudson-basilica-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://basilicahudson.org/events/",
    externalId: "basilica-2026-sugar",
    title: "SUGAR",
    presenter: "Basilica Hudson",
    taxonomy: ["concert", "rock"],
    startsAt: "2026-10-18T20:00:00-04:00",
    venueName: "Basilica Hudson",
    neighborhood: "South Front Street",
    areaId: "hudson",
    distanceMiles: 0.9,
    description:
      "A Basilica Hudson upcoming-event listing for October 18, preserved from the reusable local calendar source.",
    tags: ["rock", "basilica hudson", "regional music"],
    imageTone: "#5D3B45",
    ticketUrl: "https://basilicahudson.org/events/sugar/",
    remainingEstimate: 24,
    maxQuantity: 4,
    recommendationSignals: ["category:concert", "spotify:rock"]
  },
  {
    calendarId: "hudson-basilica-calendar",
    sourceKind: "html-calendar",
    sourceUrl: "https://basilicahudson.org/events/",
    externalId: "basilica-2026-sleep",
    title: "SLEEP",
    presenter: "Basilica Hudson",
    taxonomy: ["concert", "metal"],
    startsAt: "2026-11-13T20:00:00-05:00",
    venueName: "Basilica Hudson",
    neighborhood: "South Front Street",
    areaId: "hudson",
    distanceMiles: 0.9,
    description:
      "A Basilica Hudson upcoming-event listing for November 13, preserved from the reusable local calendar source.",
    tags: ["metal", "basilica hudson", "regional music"],
    imageTone: "#3D3A45",
    ticketUrl: "https://basilicahudson.org/events/sleep/",
    remainingEstimate: 24,
    maxQuantity: 4,
    recommendationSignals: ["category:concert", "spotify:metal"]
  }
];
