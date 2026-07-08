import type { TicketmasterDiscoveryResponse } from "../services/ticketmasterProvider";

export const ticketmasterDiscoveryFixture: TicketmasterDiscoveryResponse = {
  _embedded: {
    events: [
      {
        id: "tm-nyc-900",
        name: "Hadestown",
        url: "https://example.com/ticketmaster/hadestown",
        info: "A touring musical with primary-market ticket inventory.",
        dates: {
          start: {
            dateTime: "2026-07-10T23:30:00Z",
            localDate: "2026-07-10",
            localTime: "19:30:00"
          }
        },
        classifications: [
          {
            segment: { name: "Arts & Theatre" },
            genre: { name: "Theatre" },
            subGenre: { name: "Musical" }
          }
        ],
        priceRanges: [
          {
            currency: "USD",
            min: 49.5,
            max: 179
          }
        ],
        _embedded: {
          attractions: [{ name: "Hadestown Touring Company" }],
          venues: [
            {
              name: "Walter Kerr Theatre",
              city: { name: "New York" },
              state: { stateCode: "NY" },
              location: {
                latitude: "40.7590",
                longitude: "-73.9870"
              }
            }
          ]
        }
      },
      {
        id: "tm-nyc-901",
        name: "Boiler Room: Brooklyn",
        url: "https://example.com/ticketmaster/boiler-room-brooklyn",
        info: "A warehouse DJ bill with primary ticketing and partner transfer.",
        dates: {
          start: {
            dateTime: "2026-07-12T02:00:00Z",
            localDate: "2026-07-11",
            localTime: "22:00:00"
          }
        },
        classifications: [
          {
            segment: { name: "Music" },
            genre: { name: "Dance/Electronic" },
            subGenre: { name: "Club Dance" }
          }
        ],
        priceRanges: [
          {
            currency: "USD",
            min: 38,
            max: 68
          }
        ],
        _embedded: {
          attractions: [{ name: "Boiler Room" }],
          venues: [
            {
              name: "Brooklyn Mirage",
              city: { name: "Brooklyn" },
              state: { stateCode: "NY" },
              location: {
                latitude: "40.7105",
                longitude: "-73.9331"
              }
            }
          ]
        }
      },
      {
        id: "tm-la-100",
        name: "Sunset Rock Night",
        url: "https://example.com/ticketmaster/sunset-rock-night",
        dates: {
          start: {
            dateTime: "2026-07-12T04:00:00Z",
            localDate: "2026-07-11",
            localTime: "21:00:00"
          }
        },
        classifications: [
          {
            segment: { name: "Music" },
            genre: { name: "Rock" }
          }
        ],
        priceRanges: [
          {
            currency: "USD",
            min: 31,
            max: 52
          }
        ],
        _embedded: {
          attractions: [{ name: "Sunset Rock Night" }],
          venues: [
            {
              name: "The Graft",
              city: { name: "Los Angeles" },
              state: { stateCode: "CA" },
              location: {
                latitude: "34.0440",
                longitude: "-118.2360"
              }
            }
          ]
        }
      }
    ]
  },
  page: {
    totalElements: 3
  }
};
