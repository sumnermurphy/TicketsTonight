import type { Area, Show, ShowCategory } from "../types";

export const areas: Area[] = [
  {
    id: "nyc",
    name: "New York",
    region: "NY",
    timezone: "America/New_York",
    coordinates: { latitude: 40.7128, longitude: -74.006 },
    discoveryRole: "primary",
    discoveryLabel: "Primary alpha",
    discoveryNote: "Densest test market for theater, dance, opera, concerts, and late-night shows."
  },
  {
    id: "la",
    name: "Los Angeles",
    region: "CA",
    timezone: "America/Los_Angeles",
    coordinates: { latitude: 34.0522, longitude: -118.2437 },
    discoveryRole: "secondary",
    discoveryLabel: "Secondary market",
    discoveryNote: "West Coast validation for concerts, DJ sets, opera, and venue-direct inventory."
  },
  {
    id: "hudson",
    name: "Hudson",
    region: "NY",
    timezone: "America/New_York",
    coordinates: { latitude: 42.2529, longitude: -73.7909 },
    discoveryRole: "test",
    discoveryLabel: "Arts-town test",
    discoveryNote: "Smaller-market check for weekend trips, performing arts, and regional venues."
  }
];

export const categoryLabels: Record<ShowCategory, string> = {
  concert: "Concerts",
  dj: "DJ Sets",
  dance: "Dance",
  ballet: "Ballet",
  opera: "Opera",
  theater: "Theater",
  comedy: "Comedy"
};

export const shows: Show[] = [
  {
    id: "show-alina-ives",
    title: "Alina Ives: Electric Room",
    artistOrCompany: "Alina Ives",
    category: "concert",
    startsAt: "2026-07-08T20:00:00-04:00",
    venue: "Mercury Ballroom",
    neighborhood: "Lower East Side",
    areaId: "nyc",
    distanceMiles: 1.4,
    vibe: ["indie pop", "late set", "standing room"],
    description: "A polished club set with synth-heavy hooks and a small-room feel.",
    ticketOffers: [
      {
        id: "ga",
        label: "General admission",
        priceCents: 3400,
        listPriceCents: 4200,
        currency: "USD",
        remaining: 24,
        maxQuantity: 6,
        access: "mobile-entry",
        source: "partner-feed",
        deal: {
          id: "deal-alina-tonight",
          label: "Tonight drop",
          description: "Partner release for same-day buyers.",
          discountPercent: 19,
          expiresAt: "2026-07-08T18:45:00-04:00"
        },
        perks: ["Mobile entry"]
      },
      {
        id: "balcony",
        label: "Balcony",
        priceCents: 5200,
        currency: "USD",
        remaining: 8,
        maxQuantity: 4,
        access: "mobile-entry",
        source: "venue-direct",
        perks: ["Reserved view"]
      }
    ],
    source: "partner-feed",
    imageTone: "#BA4A32",
    recommendationSignals: ["spotify:indie-pop", "spotify:synth-pop"]
  },
  {
    id: "show-neon-cellar",
    title: "Neon Cellar All Night",
    artistOrCompany: "Mara Sol, Theo Lane",
    category: "dj",
    startsAt: "2026-07-08T22:30:00-04:00",
    venue: "Basement 88",
    neighborhood: "Bushwick",
    areaId: "nyc",
    distanceMiles: 4.6,
    vibe: ["house", "dance floor", "after hours"],
    description: "Two-room DJ program built around warm house, breaks, and left-field club cuts.",
    ticketOffers: [
      {
        id: "entry",
        label: "Anytime entry",
        priceCents: 2800,
        listPriceCents: 3600,
        currency: "USD",
        remaining: 42,
        maxQuantity: 8,
        access: "mobile-entry",
        source: "promoter",
        deal: {
          id: "deal-neon-dance",
          label: "Dance floor deal",
          description: "Promoter-funded price for early in-app buyers.",
          discountPercent: 22,
          expiresAt: "2026-07-08T21:30:00-04:00"
        },
        perks: ["No re-entry"]
      }
    ],
    source: "promoter",
    imageTone: "#5C496A",
    recommendationSignals: ["spotify:house", "spotify:electronic"]
  },
  {
    id: "show-giselle",
    title: "Giselle",
    artistOrCompany: "City Ballet Ensemble",
    category: "ballet",
    startsAt: "2026-07-09T19:30:00-04:00",
    venue: "Metropolitan Arts Center",
    neighborhood: "Lincoln Square",
    areaId: "nyc",
    distanceMiles: 2.2,
    vibe: ["classic", "reserved seating", "date night"],
    description: "A full-length romantic ballet with live orchestra and two evening casts.",
    ticketOffers: [
      {
        id: "mezz",
        label: "Rear mezzanine",
        priceCents: 6900,
        listPriceCents: 7900,
        currency: "USD",
        remaining: 18,
        maxQuantity: 6,
        access: "mobile-entry",
        source: "venue-direct",
        deal: {
          id: "deal-giselle-mezz",
          label: "Best value",
          description: "Lightly discounted rear mezzanine inventory.",
          amountOffCents: 1000,
          expiresAt: "2026-07-09T17:30:00-04:00"
        },
        perks: ["Best value"]
      },
      {
        id: "orchestra",
        label: "Orchestra",
        priceCents: 12800,
        currency: "USD",
        remaining: 6,
        maxQuantity: 4,
        access: "mobile-entry",
        source: "venue-direct"
      }
    ],
    source: "venue-direct",
    imageTone: "#0D7C75",
    recommendationSignals: ["category:ballet", "category:classical"]
  },
  {
    id: "show-othello",
    title: "Othello",
    artistOrCompany: "Warehouse Stage Company",
    category: "theater",
    startsAt: "2026-07-10T20:00:00-04:00",
    venue: "Pier 4 Playhouse",
    neighborhood: "Red Hook",
    areaId: "nyc",
    distanceMiles: 5.1,
    vibe: ["intimate", "modern staging", "assigned seats"],
    description: "A stripped-down production staged in the round with a compact ensemble cast.",
    ticketOffers: [
      {
        id: "standard",
        label: "Standard seat",
        priceCents: 4600,
        currency: "USD",
        remaining: 30,
        maxQuantity: 6,
        access: "mobile-entry",
        source: "venue-direct"
      }
    ],
    source: "venue-direct",
    imageTone: "#314E66",
    recommendationSignals: ["category:theater"]
  },
  {
    id: "show-pacific-opera",
    title: "The Barber of Seville",
    artistOrCompany: "Pacific Opera",
    category: "opera",
    startsAt: "2026-07-09T19:00:00-07:00",
    venue: "Hillcrest Opera House",
    neighborhood: "Hollywood",
    areaId: "la",
    distanceMiles: 3.8,
    vibe: ["comic opera", "orchestra", "reserved seating"],
    description: "A bright summer staging with English supertitles and a first-night reception.",
    ticketOffers: [
      {
        id: "balcony",
        label: "Balcony",
        priceCents: 5800,
        currency: "USD",
        remaining: 22,
        maxQuantity: 6,
        access: "mobile-entry",
        source: "venue-direct"
      },
      {
        id: "dress-circle",
        label: "Dress circle",
        priceCents: 9400,
        listPriceCents: 11200,
        currency: "USD",
        remaining: 12,
        maxQuantity: 4,
        access: "mobile-entry",
        source: "venue-direct",
        deal: {
          id: "deal-barber-circle",
          label: "Opening week",
          description: "Limited house hold released to fill dress circle.",
          amountOffCents: 1800,
          expiresAt: "2026-07-09T17:00:00-07:00"
        }
      }
    ],
    source: "venue-direct",
    imageTone: "#D9A441",
    recommendationSignals: ["category:opera", "category:classical"]
  },
  {
    id: "show-sunset-warehouse",
    title: "Sunset Warehouse Live",
    artistOrCompany: "Vera Kin, Night Bloom",
    category: "concert",
    startsAt: "2026-07-08T21:00:00-07:00",
    venue: "The Graft",
    neighborhood: "Arts District",
    areaId: "la",
    distanceMiles: 2.9,
    vibe: ["alt rock", "standing room", "last-minute friendly"],
    description: "A three-band bill with sharp guitars, quick changeovers, and a late headline set.",
    ticketOffers: [
      {
        id: "ga",
        label: "General admission",
        priceCents: 3100,
        listPriceCents: 3900,
        currency: "USD",
        remaining: 36,
        maxQuantity: 8,
        access: "mobile-entry",
        source: "partner-feed",
        deal: {
          id: "deal-sunset-lastminute",
          label: "Last-minute price",
          description: "Partner inventory priced for same-night discovery.",
          discountPercent: 21,
          expiresAt: "2026-07-08T20:15:00-07:00"
        },
        perks: ["Mobile entry"]
      }
    ],
    source: "partner-feed",
    imageTone: "#E7563C",
    recommendationSignals: ["spotify:alt-rock", "spotify:indie-rock"]
  },
  {
    id: "show-hudson-rhythm-map",
    title: "Rhythm Map",
    artistOrCompany: "Upstate Movement Project",
    category: "dance",
    startsAt: "2026-07-11T19:30:00-04:00",
    venue: "Basilica Hudson",
    neighborhood: "Waterfront",
    areaId: "hudson",
    distanceMiles: 0.9,
    vibe: ["contemporary", "warehouse space", "weekend trip"],
    description: "New contemporary works in an industrial hall with a short post-show conversation.",
    ticketOffers: [
      {
        id: "seat",
        label: "General admission",
        priceCents: 4200,
        listPriceCents: 5200,
        currency: "USD",
        remaining: 14,
        maxQuantity: 6,
        access: "mobile-entry",
        source: "venue-direct",
        deal: {
          id: "deal-hudson-rhythm-weekend",
          label: "Hudson weekend",
          description: "Regional arts allocation for weekend discovery.",
          amountOffCents: 1000,
          expiresAt: "2026-07-11T17:30:00-04:00"
        },
        perks: ["Includes talkback"]
      }
    ],
    source: "venue-direct",
    imageTone: "#28706D",
    recommendationSignals: ["category:dance"]
  },
  {
    id: "show-hudson-opera-lab",
    title: "Opera Lab: Summer Arias",
    artistOrCompany: "Hudson Hall Young Artists",
    category: "opera",
    startsAt: "2026-07-12T17:00:00-04:00",
    venue: "Hudson Hall",
    neighborhood: "Warren Street",
    areaId: "hudson",
    distanceMiles: 0.3,
    vibe: ["chamber opera", "matinee", "historic hall"],
    description: "A compact opera program pairing new arrangements with classic arias for a Sunday crowd.",
    ticketOffers: [
      {
        id: "balcony",
        label: "Balcony",
        priceCents: 3600,
        listPriceCents: 4600,
        currency: "USD",
        remaining: 28,
        maxQuantity: 6,
        access: "mobile-entry",
        source: "venue-direct",
        deal: {
          id: "deal-hudson-opera-matinee",
          label: "Matinee value",
          description: "Discounted balcony seats for Sunday arts travelers.",
          amountOffCents: 1000,
          expiresAt: "2026-07-12T14:30:00-04:00"
        },
        perks: ["Mobile entry"]
      },
      {
        id: "orchestra",
        label: "Orchestra",
        priceCents: 5800,
        currency: "USD",
        remaining: 12,
        maxQuantity: 4,
        access: "mobile-entry",
        source: "venue-direct"
      }
    ],
    source: "venue-direct",
    imageTone: "#D9A441",
    recommendationSignals: ["category:opera", "category:classical"]
  }
];
