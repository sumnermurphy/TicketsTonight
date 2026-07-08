import type { DiscoveryMarketPlan } from "../types";

export const discoveryMarketPlans: DiscoveryMarketPlan[] = [
  {
    areaId: "nyc",
    priority: 1,
    categoryFocus: ["concert", "dj", "dance", "ballet", "opera", "theater"],
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
        status: "active-fixture",
        categories: ["concert", "dj", "ballet", "theater"],
        notes: "Keeps the primary alpha experience usable while provider integrations are wired in."
      },
      {
        id: "nyc-partner-feed",
        label: "NY partner feed",
        sourceType: "partner-feed",
        status: "active-fixture",
        categories: ["theater"],
        notes: "Exercises normalized feed inventory, preview pricing, and deal alerts."
      },
      {
        id: "ticketmaster-discovery",
        label: "Ticketmaster Discovery",
        sourceType: "marketplace-api",
        status: "integration-ready",
        categories: ["concert", "dj", "dance", "ballet", "opera", "theater", "comedy"],
        notes: "First real inventory adapter for city/category/date discovery and cached detail lookup."
      },
      {
        id: "nyc-venue-direct",
        label: "Venue-direct performing arts",
        sourceType: "venue-direct",
        status: "partner-needed",
        categories: ["dance", "ballet", "opera", "theater"],
        notes: "Best path to controlled discount experiments for performing arts inventory."
      },
      {
        id: "nyc-promoter-drops",
        label: "Promoter drops",
        sourceType: "promoter-feed",
        status: "partner-needed",
        categories: ["concert", "dj"],
        notes: "Useful for same-day music and nightlife inventory where discounts can move quickly."
      }
    ]
  },
  {
    areaId: "la",
    priority: 2,
    categoryFocus: ["concert", "dj", "opera", "theater", "dance"],
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
        status: "active-fixture",
        categories: ["concert", "opera"],
        notes: "Keeps West Coast search and deal filtering covered in local fixtures."
      },
      {
        id: "la-partner-feed",
        label: "LA partner feed",
        sourceType: "partner-feed",
        status: "active-fixture",
        categories: ["dj"],
        notes: "Validates partner-feed normalization against nightlife inventory and early-entry deals."
      },
      {
        id: "la-marketplace-api",
        label: "Marketplace API expansion",
        sourceType: "marketplace-api",
        status: "integration-ready",
        categories: ["concert", "dj", "opera", "theater", "comedy"],
        notes: "Reuses the provider adapter pattern after New York proves the shape."
      },
      {
        id: "la-venue-direct",
        label: "Venue-direct arts inventory",
        sourceType: "venue-direct",
        status: "partner-needed",
        categories: ["dance", "opera", "theater"],
        notes: "Validates whether venue-direct supply differs enough from marketplace inventory."
      }
    ]
  },
  {
    areaId: "hudson",
    priority: 3,
    categoryFocus: ["dance", "opera", "theater", "concert"],
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
        status: "active-fixture",
        categories: ["dance", "opera"],
        notes: "Gives the arts-town test market enough depth for discovery and deal-alert checks."
      },
      {
        id: "hudson-partner-feed",
        label: "Hudson partner feed",
        sourceType: "partner-feed",
        status: "active-fixture",
        categories: ["theater"],
        notes: "Exercises regional preview pricing and smaller-market feed normalization."
      },
      {
        id: "hudson-calendar-feed",
        label: "Regional calendar feed",
        sourceType: "calendar-feed",
        status: "integration-ready",
        categories: ["concert", "dance", "opera", "theater"],
        notes: "Best next source pattern for small-market calendars and weekend arts discovery."
      },
      {
        id: "hudson-venue-direct",
        label: "Venue-direct regional arts",
        sourceType: "venue-direct",
        status: "partner-needed",
        categories: ["concert", "dance", "opera", "theater"],
        notes: "Gives the discount strategy a direct path to regional allocations."
      }
    ]
  }
];
