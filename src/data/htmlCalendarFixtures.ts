export const hudsonHallHtmlCalendarFixture = `
<!doctype html>
<html lang="en">
  <head>
    <title>Hudson Hall events fixture</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "Ruckus: The Edinburgh Rollick",
        "startDate": "2026-07-29T18:00:00-04:00",
        "url": "https://hudsonhall.org/event/ruckus/",
        "description": "A folk-baroque concert listing parsed from a reusable HTML calendar import.",
        "genre": ["music", "concert", "folk baroque"],
        "performer": { "@type": "MusicGroup", "name": "Ruckus" },
        "location": {
          "@type": "Place",
          "name": "Hudson Hall",
          "address": { "addressLocality": "Hudson", "addressRegion": "NY" }
        },
        "offers": {
          "@type": "Offer",
          "url": "https://hudsonhall.org/event/ruckus/",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Event",
            "name": "Midsummer Swing!",
            "startDate": "2026-07-25T18:30:00-04:00",
            "url": "https://hudsonhall.org/event/midsummer-swing/",
            "description": "Dance lesson and live music listing parsed from a Hudson Hall HTML calendar.",
            "keywords": "dance, swing, live music",
            "performer": "Hudson Hall",
            "location": "Hudson Hall",
            "offers": {
              "@type": "Offer",
              "url": "https://hudsonhall.org/event/midsummer-swing/",
              "price": "42.00",
              "priceCurrency": "USD"
            }
          },
          {
            "@type": "Organization",
            "name": "Hudson Hall"
          }
        ]
      }
    </script>
    <script type="application/ld+json">{ invalid json }</script>
  </head>
  <body>
    <article>
      <a href="https://hudsonhall.org/event/ruckus/">Ruckus</a>
      <a href="https://hudsonhall.org/event/midsummer-swing/">Midsummer Swing!</a>
    </article>
  </body>
</html>
`;
