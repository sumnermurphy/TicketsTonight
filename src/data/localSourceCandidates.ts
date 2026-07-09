import type { DiscoverySourceType, ShowCategory } from "../types";

export type LocalSourceIntakeKind =
  | "html-calendar"
  | "ics"
  | "rss"
  | "partner-feed"
  | "manual-import"
  | "newsletter"
  | "api"
  | "research-lead";

export type LocalSourceCandidateStatus =
  | "seeded-research"
  | "sample-needed"
  | "fixture-backed"
  | "parser-ready"
  | "partner-needed"
  | "deferred";

export type LocalSourceTermsPosture =
  | "public-calendar-review"
  | "partner-permission-required"
  | "api-terms-review"
  | "manual-lead-only"
  | "do-not-ingest";

export type LocalSourceTrustLevel = "official" | "partner" | "community" | "research";

export type LocalSourceCadence = "daily" | "weekly" | "monthly" | "seasonal" | "unknown";

export type LocalSourceCandidate = {
  id: string;
  label: string;
  areaId: string;
  neighborhood: string;
  sourceType: DiscoverySourceType;
  intakeKind: LocalSourceIntakeKind;
  status: LocalSourceCandidateStatus;
  priority: number;
  categories: ShowCategory[];
  sourceUrl: string;
  trustLevel: LocalSourceTrustLevel;
  expectedCadence: LocalSourceCadence;
  requiresPermission: boolean;
  hasStructuredListings: boolean;
  hasTicketLinks: boolean;
  termsPosture: LocalSourceTermsPosture;
  strengths: string[];
  constraints: string[];
  nextStep: string;
};

export type LocalSourceBuildStageId =
  | "discover"
  | "register"
  | "sample"
  | "terms-review"
  | "normalize"
  | "dedupe"
  | "promote"
  | "monitor";

export type LocalSourceBuildStage = {
  id: LocalSourceBuildStageId;
  label: string;
  owner: "ops" | "data" | "engineering" | "partnerships";
  exitCriteria: string[];
};

export const localSourceBuildStages: LocalSourceBuildStage[] = [
  {
    id: "discover",
    label: "Find candidate sources",
    owner: "ops",
    exitCriteria: [
      "At least five official venue, calendar, promoter, or community leads are identified.",
      "Each lead has a market, neighborhood, URL, likely categories, and intake path."
    ]
  },
  {
    id: "register",
    label: "Register source metadata",
    owner: "data",
    exitCriteria: [
      "The candidate is added to the local source directory.",
      "Source type, intake kind, terms posture, cadence, and permission needs are explicit."
    ]
  },
  {
    id: "sample",
    label: "Collect sample listings",
    owner: "ops",
    exitCriteria: [
      "Five to ten upcoming events are reviewed.",
      "Title, start time, venue, category hints, ticket links, and price fields are measured."
    ]
  },
  {
    id: "terms-review",
    label: "Review rights and terms",
    owner: "partnerships",
    exitCriteria: [
      "Public-calendar, API, partner-feed, or manual-only posture is confirmed.",
      "Sources requiring written permission stay out of automated ingestion."
    ]
  },
  {
    id: "normalize",
    label: "Normalize into app events",
    owner: "engineering",
    exitCriteria: [
      "Sample listings can become LocalCalendarEvent or partner-feed-shaped records.",
      "Ticket URLs and prices are preserved without inventing unavailable data."
    ]
  },
  {
    id: "dedupe",
    label: "Measure duplicate overlap",
    owner: "data",
    exitCriteria: [
      "The source is compared with broad APIs, fixtures, and other local feeds.",
      "Duplicate rate and category lift are reported before promotion."
    ]
  },
  {
    id: "promote",
    label: "Promote to monitored source",
    owner: "engineering",
    exitCriteria: [
      "The source has freshness, import-count, and ticket-link coverage checks.",
      "Failed refreshes fall back to existing inventory without breaking discovery."
    ]
  },
  {
    id: "monitor",
    label: "Monitor quality",
    owner: "data",
    exitCriteria: [
      "Freshness, skipped listings, duplicate rate, category mix, and link coverage are tracked.",
      "The source is demoted or paused when quality drops."
    ]
  }
];

export const localSourceCandidates: LocalSourceCandidate[] = [
  {
    id: "nyc-performing-arts-calendar",
    label: "NYC performing arts calendar",
    areaId: "nyc",
    neighborhood: "Chelsea / Lincoln Center",
    sourceType: "calendar-feed",
    intakeKind: "html-calendar",
    status: "fixture-backed",
    priority: 1,
    categories: ["dance", "ballet", "opera"],
    sourceUrl: "https://www.joyce.org/performances",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: [
      "Already represented by checked-in fixture samples",
      "Adds performing-arts depth that broad marketplaces often miss"
    ],
    constraints: ["Needs source-by-source legal review before live import"],
    nextStep: "Promote one fixture-backed performing-arts source into a monitored parser."
  },
  {
    id: "nyc-babys-all-right",
    label: "Baby's All Right",
    areaId: "nyc",
    neighborhood: "Williamsburg",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 2,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://babysallright.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Small-room music fit", "Official site points to a ticketed calendar"],
    constraints: ["Calendar is ticketing-platform hosted, so parser shape needs sampling"],
    nextStep: "Collect five event samples from the official calendar and measure ticket-link preservation."
  },
  {
    id: "nyc-public-records",
    label: "Public Records",
    areaId: "nyc",
    neighborhood: "Gowanus",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 3,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://publicrecords.nyc/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["High-fit listening room and club programming", "Useful for under-the-radar nightlife"],
    constraints: ["Site protections may require partner feed or manual review instead of scraping"],
    nextStep: "Sample the official event flow and decide whether this is parser-ready or partner-needed."
  },
  {
    id: "nyc-elsewhere",
    label: "Elsewhere",
    areaId: "nyc",
    neighborhood: "Bushwick",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 4,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://www.elsewherebrooklyn.com/events",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Strong music and nightlife category fit", "Usually ticket-link rich"],
    constraints: ["May duplicate marketplace and ticketing-platform inventory"],
    nextStep: "Compare ten upcoming events against Ticketmaster/Eventbrite duplicates."
  },
  {
    id: "nyc-cmon-everybody",
    label: "C'mon Everybody",
    areaId: "nyc",
    neighborhood: "Bedford-Stuyvesant",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 5,
    categories: ["concert", "dj", "comedy", "variety"],
    sourceUrl: "https://www.cmoneverybody.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Excellent fit for queer nightlife, comedy, and small-room music"],
    constraints: ["Category normalization must separate shows, parties, and community events"],
    nextStep: "Collect samples across music, DJ, comedy, and variety listings."
  },
  {
    id: "nyc-tv-eye",
    label: "TV Eye",
    areaId: "nyc",
    neighborhood: "Ridgewood",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 6,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://www.tveyenyc.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Good Queens small-venue coverage", "Adds local music depth outside Manhattan"],
    constraints: ["Needs duplicate checks against ticketing marketplaces"],
    nextStep: "Sample upcoming event pages and record ticket-platform fields."
  },
  {
    id: "nyc-sultan-room",
    label: "The Sultan Room",
    areaId: "nyc",
    neighborhood: "Bushwick",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 7,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://thesultanroom.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Venue calendar can add global music, DJ, and variety programming"],
    constraints: ["Shared ticketing platform may duplicate other feeds"],
    nextStep: "Measure event count, ticket links, and duplicate rate for the next 30 days."
  },
  {
    id: "nyc-nublu",
    label: "Nublu",
    areaId: "nyc",
    neighborhood: "East Village",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 8,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://nublu.net/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Adds jazz, electronic, and late-night local programming"],
    constraints: ["Event copy may need careful taxonomy cleanup"],
    nextStep: "Sample event detail pages and normalize jazz/electronic tags."
  },
  {
    id: "nyc-smalls-jazz-club",
    label: "Smalls Jazz Club",
    areaId: "nyc",
    neighborhood: "Greenwich Village",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 9,
    categories: ["concert"],
    sourceUrl: "https://www.smallslive.com/",
    trustLevel: "official",
    expectedCadence: "daily",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["High-frequency jazz source", "Useful for same-night discovery"],
    constraints: ["May require special handling for multiple sets per night"],
    nextStep: "Confirm whether each set should be a separate listing or grouped show."
  },
  {
    id: "nyc-the-skint",
    label: "The Skint",
    areaId: "nyc",
    neighborhood: "Citywide",
    sourceType: "partner-feed",
    intakeKind: "newsletter",
    status: "partner-needed",
    priority: 10,
    categories: ["concert", "dj", "comedy", "variety"],
    sourceUrl: "https://www.theskint.com/",
    trustLevel: "community",
    expectedCadence: "weekly",
    requiresPermission: true,
    hasStructuredListings: false,
    hasTicketLinks: true,
    termsPosture: "partner-permission-required",
    strengths: ["Strong cheap/free local-event curation", "Good fit for unknown things"],
    constraints: ["Use as partner or manual lead source, not blind ingestion"],
    nextStep: "Open a partnership/manual-lead conversation before any automated import."
  },
  {
    id: "nyc-nonsense-nyc",
    label: "Nonsense NYC",
    areaId: "nyc",
    neighborhood: "Citywide",
    sourceType: "partner-feed",
    intakeKind: "newsletter",
    status: "partner-needed",
    priority: 11,
    categories: ["comedy", "variety", "concert", "dj"],
    sourceUrl: "https://www.nonsensenyc.com/",
    trustLevel: "community",
    expectedCadence: "weekly",
    requiresPermission: true,
    hasStructuredListings: false,
    hasTicketLinks: true,
    termsPosture: "partner-permission-required",
    strengths: ["Excellent weird/local discovery signal", "Good candidate for reviewed hidden-gem leads"],
    constraints: ["Newsletter content needs permission and manual review"],
    nextStep: "Treat as a lead source until permissioned submissions or partnership exists."
  },
  {
    id: "nyc-donyc",
    label: "DoNYC",
    areaId: "nyc",
    neighborhood: "Citywide",
    sourceType: "partner-feed",
    intakeKind: "research-lead",
    status: "partner-needed",
    priority: 12,
    categories: ["concert", "dj", "comedy", "variety"],
    sourceUrl: "https://donyc.com/",
    trustLevel: "community",
    expectedCadence: "daily",
    requiresPermission: true,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "partner-permission-required",
    strengths: ["Broad local event leads", "Useful for comparing source gaps"],
    constraints: ["Aggregator content should not be copied without partnership"],
    nextStep: "Use for market research and partnership outreach, not automated ingestion."
  },
  {
    id: "nyc-resident-advisor-partner-lead",
    label: "Resident Advisor partner/API lead",
    areaId: "nyc",
    neighborhood: "Citywide",
    sourceType: "promoter-feed",
    intakeKind: "api",
    status: "partner-needed",
    priority: 13,
    categories: ["dj"],
    sourceUrl: "https://ra.co/events/us/newyork",
    trustLevel: "research",
    expectedCadence: "daily",
    requiresPermission: true,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "partner-permission-required",
    strengths: ["High-fit electronic nightlife signal"],
    constraints: ["Written partner/API permission required; no scraping"],
    nextStep: "Keep as a partner conversation only until an authorized API/feed exists."
  },
  {
    id: "la-performing-arts-calendar",
    label: "LA performing arts calendars",
    areaId: "la",
    neighborhood: "Downtown / Bunker Hill",
    sourceType: "calendar-feed",
    intakeKind: "html-calendar",
    status: "parser-ready",
    priority: 1,
    categories: ["dance", "opera", "play", "theater", "variety"],
    sourceUrl: "https://www.laopera.org/performances/",
    trustLevel: "official",
    expectedCadence: "seasonal",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: [
      "Reusable performing-arts calendar path for LA weak lanes",
      "Keeps opera, theater, and dance coverage ahead of venue-direct one-offs"
    ],
    constraints: ["Needs fixture samples and ticket-link health before live promotion"],
    nextStep: "Collect source samples and run the shared event-list parser before adding venue-specific adapters."
  },
  {
    id: "la-zebulon",
    label: "Zebulon",
    areaId: "la",
    neighborhood: "Frogtown",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 1,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://zebulon.la/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Strong LA small-room music and film/event fit"],
    constraints: ["Parser shape needs sample coverage across events"],
    nextStep: "Collect event samples from the official events page and normalize ticket links."
  },
  {
    id: "la-lodge-room",
    label: "Lodge Room",
    areaId: "la",
    neighborhood: "Highland Park",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 2,
    categories: ["concert", "dj", "comedy", "variety"],
    sourceUrl: "https://www.lodgeroomhlp.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Adds Northeast LA concert depth", "Ticket-link rich venue calendar candidate"],
    constraints: ["Needs duplicate checks against broad marketplaces"],
    nextStep: "Sample 30-day inventory and compare duplicates against Ticketmaster."
  },
  {
    id: "la-gold-diggers",
    label: "Gold-Diggers",
    areaId: "la",
    neighborhood: "East Hollywood",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 3,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://gold-diggers.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Small-room music and nightlife fit", "Useful for late-night local picks"],
    constraints: ["Calendar/ticket platform shape needs validation"],
    nextStep: "Collect samples and map show/category tags into app taxonomy."
  },
  {
    id: "la-the-echo",
    label: "The Echo / Echoplex",
    areaId: "la",
    neighborhood: "Echo Park",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 4,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://theecho.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Core LA concert source", "Likely high event volume"],
    constraints: ["May duplicate many broad-provider listings"],
    nextStep: "Measure duplicate rate and net category lift before parser work."
  },
  {
    id: "la-moroccan-lounge",
    label: "Moroccan Lounge",
    areaId: "la",
    neighborhood: "Arts District",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 5,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://moroccanlounge.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Downtown small-room music coverage", "Good ticket-link candidate"],
    constraints: ["Needs sample validation for structured metadata"],
    nextStep: "Collect five upcoming listings and normalize date/ticket fields."
  },
  {
    id: "la-hotel-cafe",
    label: "The Hotel Cafe",
    areaId: "la",
    neighborhood: "Hollywood",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 6,
    categories: ["concert"],
    sourceUrl: "https://www.hotelcafe.com/",
    trustLevel: "official",
    expectedCadence: "daily",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["High-frequency songwriter and small-stage inventory"],
    constraints: ["Multiple rooms/sets may need grouping rules"],
    nextStep: "Decide whether room/set variants become separate events."
  },
  {
    id: "la-dynasty-typewriter",
    label: "Dynasty Typewriter",
    areaId: "la",
    neighborhood: "Westlake",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 7,
    categories: ["comedy", "variety"],
    sourceUrl: "https://www.dynastytypewriter.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Strong comedy and variety source", "Useful outside pure music coverage"],
    constraints: ["Needs category cleanup for podcasts, talks, and screenings"],
    nextStep: "Sample comedy/variety listings and tune taxonomy rules."
  },
  {
    id: "la-lyric-hyperion",
    label: "Lyric Hyperion",
    areaId: "la",
    neighborhood: "Silver Lake",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 8,
    categories: ["comedy", "theater", "variety"],
    sourceUrl: "https://www.lyrichyperion.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Adds alt-comedy, theater, and performance depth"],
    constraints: ["Small productions may have sparse metadata"],
    nextStep: "Collect samples and confirm category/ticket-link consistency."
  },
  {
    id: "la-permanent-records-roadhouse",
    label: "Permanent Records Roadhouse",
    areaId: "la",
    neighborhood: "Cypress Park",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 9,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://www.permanentrecordsroadhouse.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Very small-room local music signal", "Good hidden-gem candidate"],
    constraints: ["Lower volume than larger venues"],
    nextStep: "Use as a sample source for the manual-review and parser-ready path."
  },
  {
    id: "la-dola",
    label: "DoLA",
    areaId: "la",
    neighborhood: "Citywide",
    sourceType: "partner-feed",
    intakeKind: "research-lead",
    status: "partner-needed",
    priority: 10,
    categories: ["concert", "dj", "comedy", "variety"],
    sourceUrl: "https://dola.com/",
    trustLevel: "community",
    expectedCadence: "daily",
    requiresPermission: true,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "partner-permission-required",
    strengths: ["Broad LA event leads", "Useful for coverage-gap research"],
    constraints: ["Aggregator content should be partner-only or manually reviewed"],
    nextStep: "Use as a research lead and partnership candidate, not direct ingestion."
  },
  {
    id: "la-resident-advisor-partner-lead",
    label: "Resident Advisor partner/API lead",
    areaId: "la",
    neighborhood: "Citywide",
    sourceType: "promoter-feed",
    intakeKind: "api",
    status: "partner-needed",
    priority: 11,
    categories: ["dj"],
    sourceUrl: "https://ra.co/events/us/losangeles",
    trustLevel: "research",
    expectedCadence: "daily",
    requiresPermission: true,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "partner-permission-required",
    strengths: ["High-fit electronic nightlife signal"],
    constraints: ["Written partner/API permission required; no scraping"],
    nextStep: "Keep as a partner conversation only until an authorized API/feed exists."
  },
  {
    id: "hudson-arts-calendar",
    label: "Hudson regional arts calendar",
    areaId: "hudson",
    neighborhood: "Warren Street",
    sourceType: "calendar-feed",
    intakeKind: "html-calendar",
    status: "parser-ready",
    priority: 1,
    categories: ["concert", "dance", "opera", "play", "theater", "variety"],
    sourceUrl: "https://hudsonhall.org/events/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Already backed by fixture and parser pilot coverage", "Best small-market proof path"],
    constraints: ["Needs ongoing freshness monitoring before promotion"],
    nextStep: "Keep using Hudson as the repeatable calendar-feed proof market."
  },
  {
    id: "hudson-fisher-center-calendar",
    label: "Fisher Center / Bard SummerScape",
    areaId: "hudson",
    neighborhood: "Annandale-on-Hudson",
    sourceType: "calendar-feed",
    intakeKind: "html-calendar",
    status: "parser-ready",
    priority: 2,
    categories: ["concert", "opera", "theater", "variety"],
    sourceUrl: "https://fishercenter.bard.edu/whats-on/",
    trustLevel: "official",
    expectedCadence: "seasonal",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Destination arts source with ticket links", "Strong opera and theater lift"],
    constraints: ["Seasonality needs freshness logic"],
    nextStep: "Promote fixture samples into the regional calendar parser after legal review."
  },
  {
    id: "hudson-basilica-calendar",
    label: "Basilica Hudson",
    areaId: "hudson",
    neighborhood: "Waterfront",
    sourceType: "calendar-feed",
    intakeKind: "html-calendar",
    status: "parser-ready",
    priority: 3,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://basilicahudson.org/events/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Adds Hudson music and electronic-adjacent depth", "Strong local identity"],
    constraints: ["Needs duplicate checks around larger ticketed events"],
    nextStep: "Keep measuring ticket links and category lift before bespoke adapters."
  },
  {
    id: "hudson-avalon-lounge",
    label: "The Avalon Lounge",
    areaId: "hudson",
    neighborhood: "Catskill",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 4,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://www.theavalonlounge.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Small-room regional music and bar-events fit"],
    constraints: ["Outside the core Hudson area, distance and neighborhood labels matter"],
    nextStep: "Collect samples and decide if Catskill listings belong in the Hudson market rail."
  },
  {
    id: "hudson-tubbys-kingston",
    label: "Tubby's Kingston",
    areaId: "hudson",
    neighborhood: "Kingston",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 5,
    categories: ["concert", "dj", "variety"],
    sourceUrl: "https://www.tubbyskingston.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["High-fit upstate small music room", "Good weekend-trip discovery candidate"],
    constraints: ["Distance from Hudson needs clear UX treatment"],
    nextStep: "Sample calendar listings and measure whether Kingston belongs in Hudson expansion."
  },
  {
    id: "hudson-colony-woodstock",
    label: "Colony Woodstock",
    areaId: "hudson",
    neighborhood: "Woodstock",
    sourceType: "venue-direct",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 6,
    categories: ["concert", "comedy", "variety"],
    sourceUrl: "https://www.colonywoodstock.com/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Regional concert and variety source", "Useful for weekend arts-town behavior"],
    constraints: ["May stretch the Hudson geography too far without trip context"],
    nextStep: "Treat as a regional expansion candidate after Hudson/Catskill/Kingston coverage is stable."
  },
  {
    id: "hudson-opus-40",
    label: "Opus 40",
    areaId: "hudson",
    neighborhood: "Saugerties",
    sourceType: "calendar-feed",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 7,
    categories: ["concert", "dance", "variety"],
    sourceUrl: "https://opus40.org/events/",
    trustLevel: "official",
    expectedCadence: "seasonal",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Outdoor arts and music programming", "Adds seasonal destination events"],
    constraints: ["Seasonality and weather-related changes need monitoring"],
    nextStep: "Sample seasonal listings and mark stale windows explicitly."
  },
  {
    id: "hudson-bardavon-upac",
    label: "Bardavon / UPAC",
    areaId: "hudson",
    neighborhood: "Poughkeepsie / Kingston",
    sourceType: "calendar-feed",
    intakeKind: "html-calendar",
    status: "sample-needed",
    priority: 8,
    categories: ["concert", "dance", "theater", "comedy", "variety"],
    sourceUrl: "https://www.bardavon.org/",
    trustLevel: "official",
    expectedCadence: "weekly",
    requiresPermission: false,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "public-calendar-review",
    strengths: ["Regional ticketed baseline beyond Hudson proper", "Adds theater/comedy/dance depth"],
    constraints: ["Large regional venues may be less hidden-gem oriented"],
    nextStep: "Use as regional baseline after smaller Hudson calendar feeds are stable."
  },
  {
    id: "hudson-chronogram-events",
    label: "Chronogram events calendar",
    areaId: "hudson",
    neighborhood: "Hudson Valley",
    sourceType: "partner-feed",
    intakeKind: "research-lead",
    status: "partner-needed",
    priority: 9,
    categories: ["concert", "dance", "play", "theater", "comedy", "variety"],
    sourceUrl: "https://www.chronogram.com/hudsonvalley/EventSearch",
    trustLevel: "community",
    expectedCadence: "daily",
    requiresPermission: true,
    hasStructuredListings: true,
    hasTicketLinks: true,
    termsPosture: "partner-permission-required",
    strengths: ["Broad Hudson Valley discovery leads", "Good way to find unknown local sources"],
    constraints: ["Aggregator content should be partner-only or manually reviewed"],
    nextStep: "Use for research and outreach to original venues, not direct ingestion."
  }
];
