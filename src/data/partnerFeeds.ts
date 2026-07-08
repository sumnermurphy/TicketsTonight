import type { InventorySource, OfferAccess } from "../types";

export type PartnerFeedOffer = {
  id: string;
  name: string;
  priceCents: number;
  faceValueCents?: number;
  remaining: number;
  maxQuantity: number;
  access: OfferAccess;
  source: InventorySource;
  dealLabel?: string;
  dealDescription?: string;
  dealExpiresAt?: string;
  amountOffCents?: number;
  discountPercent?: number;
  perks?: string[];
};

export type PartnerFeedEvent = {
  providerId: string;
  externalId: string;
  title: string;
  performer: string;
  taxonomy: string[];
  startsAt: string;
  venueName: string;
  neighborhood: string;
  areaId: string;
  distanceMiles: number;
  description: string;
  tags: string[];
  source: InventorySource;
  imageTone: string;
  offers: PartnerFeedOffer[];
  recommendationSignals?: string[];
};

export const partnerFeedEvents: PartnerFeedEvent[] = [
  {
    providerId: "venuecloud",
    externalId: "vc-1001",
    title: "Small Hours: New Plays",
    performer: "Canal Street Rep",
    taxonomy: ["theatre", "play", "experimental"],
    startsAt: "2026-07-12T19:30:00-04:00",
    venueName: "Canal Street Loft",
    neighborhood: "SoHo",
    areaId: "nyc",
    distanceMiles: 1.9,
    description: "Three short new plays staged in a flexible loft space with a post-show bar.",
    tags: ["new writing", "intimate", "downtown"],
    source: "venue-direct",
    imageTone: "#314E66",
    offers: [
      {
        id: "standard",
        name: "Reserved seat",
        priceCents: 3800,
        faceValueCents: 4800,
        remaining: 26,
        maxQuantity: 6,
        access: "mobile-entry",
        source: "venue-direct",
        dealLabel: "Preview price",
        dealDescription: "Early preview inventory released to fill the room.",
        dealExpiresAt: "2026-07-12T17:30:00-04:00",
        amountOffCents: 1000,
        perks: ["Post-show bar"]
      }
    ],
    recommendationSignals: ["category:play"]
  },
  {
    providerId: "nightlist",
    externalId: "nl-774",
    title: "Rooftop Frequency",
    performer: "Nia Vale, Armand Fox",
    taxonomy: ["dj", "electronic", "house"],
    startsAt: "2026-07-11T22:00:00-07:00",
    venueName: "Signal Roof",
    neighborhood: "Downtown",
    areaId: "la",
    distanceMiles: 1.7,
    description: "A sunset-to-late-night rooftop DJ bill with melodic house and disco-leaning sets.",
    tags: ["house", "rooftop", "late night"],
    source: "promoter",
    imageTone: "#5C496A",
    offers: [
      {
        id: "entry",
        name: "Entry before 11 PM",
        priceCents: 2600,
        faceValueCents: 3400,
        remaining: 44,
        maxQuantity: 8,
        access: "mobile-entry",
        source: "promoter",
        dealLabel: "Early arrival",
        dealDescription: "Discounted entry for guests arriving before 11 PM.",
        dealExpiresAt: "2026-07-11T21:30:00-07:00",
        discountPercent: 24,
        perks: ["Arrive before 11 PM"]
      }
    ],
    recommendationSignals: ["spotify:house", "spotify:electronic"]
  },
  {
    providerId: "artswire",
    externalId: "aw-550",
    title: "The Orchard Room: New One-Acts",
    performer: "Hudson Valley Stage",
    taxonomy: ["theatre", "play", "new writing"],
    startsAt: "2026-07-13T18:30:00-04:00",
    venueName: "Stageworks Studio",
    neighborhood: "Waterfront",
    areaId: "hudson",
    distanceMiles: 0.7,
    description: "A regional-theater evening of short plays built for a small-room Hudson audience.",
    tags: ["new writing", "regional theater", "seated"],
    source: "partner-feed",
    imageTone: "#314E66",
    offers: [
      {
        id: "seat",
        name: "Reserved seat",
        priceCents: 3400,
        faceValueCents: 4400,
        remaining: 20,
        maxQuantity: 6,
        access: "mobile-entry",
        source: "partner-feed",
        dealLabel: "Regional preview",
        dealDescription: "Preview allocation for early Hudson-market testers.",
        dealExpiresAt: "2026-07-13T16:30:00-04:00",
        amountOffCents: 1000,
        perks: ["Mobile entry"]
      }
    ],
    recommendationSignals: ["category:play"]
  }
];
