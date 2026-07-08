import type { DiscoveryMarketPlan } from "../types";

export const discoveryMarketPlans: DiscoveryMarketPlan[] = [
  {
    areaId: "nyc",
    priority: 1,
    categoryFocus: [
      "concert",
      "dj",
      "dance",
      "ballet",
      "opera",
      "play",
      "theater",
      "comedy",
      "variety"
    ],
    discountLevers: [
      "same-day drops",
      "preview allocations",
      "matinee value",
      "promoter-funded early entry"
    ],
    sources: [
      {
        id: "nyc-seed-catalog",
        label: "NY seed catalog",
        sourceType: "seed-catalog",
        lane: "seed-fixture",
        status: "active-fixture",
        categories: ["concert", "dj", "ballet", "play", "theater", "comedy", "variety"],
        notes: "Keeps the primary alpha experience usable while provider integrations are wired in."
      },
      {
        id: "nyc-partner-feed",
        label: "NY partner feed",
        sourceType: "partner-feed",
        lane: "local-pipeline",
        status: "active-fixture",
        categories: ["play"],
        notes: "Exercises normalized feed inventory, preview pricing, and deal alerts."
      },
      {
        id: "nyc-performing-arts-calendar",
        label: "NYC performing arts calendar",
        sourceType: "calendar-feed",
        lane: "local-pipeline",
        status: "integration-ready",
        categories: ["dance", "ballet", "opera"],
        notes:
          "Reusable HTML-calendar path for performing-arts depth before building one-off venue adapters."
      },
      {
        id: "ticketmaster-discovery",
        label: "Ticketmaster Discovery",
        sourceType: "marketplace-api",
        lane: "broad-api",
        status: "integration-ready",
        categories: [
          "concert",
          "dj",
          "dance",
          "ballet",
          "opera",
          "play",
          "theater",
          "comedy",
          "variety"
        ],
        notes: "First real inventory adapter for city/category/date discovery and cached detail lookup."
      },
      {
        id: "nyc-venue-direct",
        label: "Venue-direct performing arts",
        sourceType: "venue-direct",
        lane: "local-pipeline",
        status: "partner-needed",
        categories: ["dance", "ballet", "opera", "play", "theater", "variety"],
        notes: "Best path to controlled discount experiments for performing arts inventory."
      },
      {
        id: "nyc-promoter-drops",
        label: "Promoter drops",
        sourceType: "promoter-feed",
        lane: "local-pipeline",
        status: "partner-needed",
        categories: ["concert", "dj", "variety"],
        notes: "Useful for same-day music and nightlife inventory where discounts can move quickly."
      }
    ]
  },
  {
    areaId: "la",
    priority: 2,
    categoryFocus: ["concert", "dj", "opera", "play", "theater", "dance", "comedy", "variety"],
    discountLevers: [
      "early arrival",
      "same-week unsold inventory",
      "venue-direct holds",
      "off-peak performance pricing"
    ],
    sources: [
      {
        id: "la-seed-catalog",
        label: "LA seed catalog",
        sourceType: "seed-catalog",
        lane: "seed-fixture",
        status: "active-fixture",
        categories: ["concert", "opera"],
        notes: "Keeps West Coast search and deal filtering covered in local fixtures."
      },
      {
        id: "la-partner-feed",
        label: "LA partner feed",
        sourceType: "partner-feed",
        lane: "local-pipeline",
        status: "active-fixture",
        categories: ["dj"],
        notes: "Validates partner-feed normalization against nightlife inventory and early-entry deals."
      },
      {
        id: "la-marketplace-api",
        label: "Marketplace API expansion",
        sourceType: "marketplace-api",
        lane: "broad-api",
        status: "integration-ready",
        categories: ["concert", "dj", "opera", "play", "theater", "comedy", "variety"],
        notes: "Reuses the provider adapter pattern after New York proves the shape."
      },
      {
        id: "la-venue-direct",
        label: "Venue-direct arts inventory",
        sourceType: "venue-direct",
        lane: "local-pipeline",
        status: "partner-needed",
        categories: ["dance", "opera", "play", "theater", "variety"],
        notes: "Validates whether venue-direct supply differs enough from marketplace inventory."
      }
    ]
  },
  {
    areaId: "hudson",
    priority: 3,
    categoryFocus: ["dance", "opera", "play", "theater", "concert", "variety"],
    discountLevers: [
      "regional preview allocations",
      "weekend-trip bundles",
      "matinee value",
      "small-room fill rates"
    ],
    sources: [
      {
        id: "hudson-seed-catalog",
        label: "Hudson seed catalog",
        sourceType: "seed-catalog",
        lane: "seed-fixture",
        status: "active-fixture",
        categories: ["dance", "opera", "variety"],
        notes: "Gives the arts-town test market enough depth for discovery and deal-alert checks."
      },
      {
        id: "hudson-marketplace-api",
        label: "Marketplace API baseline",
        sourceType: "marketplace-api",
        lane: "broad-api",
        status: "integration-ready",
        categories: ["concert", "dance", "opera", "play", "theater", "variety"],
        notes: "Runs the same broad-provider adapters first, then lets local sources fill smaller-market gaps."
      },
      {
        id: "hudson-partner-feed",
        label: "Hudson partner feed",
        sourceType: "partner-feed",
        lane: "local-pipeline",
        status: "active-fixture",
        categories: ["play"],
        notes: "Exercises regional preview pricing and smaller-market feed normalization."
      },
      {
        id: "hudson-calendar-feed",
        label: "Regional calendar feed",
        sourceType: "calendar-feed",
        lane: "local-pipeline",
        status: "integration-ready",
        categories: ["concert", "dance", "opera", "play", "theater", "variety"],
        notes: "Best next source pattern for small-market calendars and weekend arts discovery."
      },
      {
        id: "hudson-venue-direct",
        label: "Venue-direct regional arts",
        sourceType: "venue-direct",
        lane: "local-pipeline",
        status: "partner-needed",
        categories: ["concert", "dance", "opera", "play", "theater", "variety"],
        notes: "Gives the discount strategy a direct path to regional allocations."
      }
    ]
  }
];
