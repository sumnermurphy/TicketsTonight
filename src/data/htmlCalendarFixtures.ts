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

export const fisherCenterHtmlCalendarFixture = `
<!doctype html>
<html lang="en">
  <head>
    <title>Fisher Center What's On fixture</title>
  </head>
  <body>
    <section aria-label="Calendar">
      <article
        class="event-card"
        data-calendar-event
        data-title="The Egyptian Helen"
        data-start="2026-07-24T18:30:00-04:00"
        data-url="/series/the-egyptian-helen/"
        data-ticket-url="/series/the-egyptian-helen/"
        data-venue="Fisher Center, Sosnoff Theater"
        data-neighborhood="Annandale-on-Hudson"
        data-taxonomy="opera, richard strauss, summerscape"
        data-price="25"
      >
        <time datetime="2026-07-24T18:30:00-04:00">July 24 - August 2</time>
        <h3><a href="/series/the-egyptian-helen/">The Egyptian Helen</a></h3>
        <span data-venue>Fisher Center, Sosnoff Theater</span>
        <a class="button" href="/series/the-egyptian-helen/">Buy Tickets</a>
      </article>
      <article
        class="event-card"
        data-calendar-event
        data-title="Program One: The Many Facets of Mozart"
        data-start="2026-08-07T19:00:00-04:00"
        data-url="/events/bmf26-p1/"
        data-ticket-url="/events/bmf26-p1/"
        data-venue="Fisher Center, Sosnoff Theater"
        data-neighborhood="Annandale-on-Hudson"
        data-taxonomy="concert, bard music festival, mozart"
        data-price="25"
      >
        <time datetime="2026-08-07T19:00:00-04:00">August 7</time>
        <h3><a href="/events/bmf26-p1/">Program One • The Many Facets of Mozart</a></h3>
        <span data-venue>Fisher Center, Sosnoff Theater</span>
        <a class="button" href="/events/bmf26-p1/">Buy Tickets</a>
      </article>
      <article
        class="event-card"
        data-calendar-event
        data-title="Mozart's Abduction from the Seraglio"
        data-start="2026-08-16T15:00:00-04:00"
        data-url="/events/bmf26-p11/"
        data-ticket-url="/events/bmf26-p11/"
        data-venue="Fisher Center, Sosnoff Theater"
        data-neighborhood="Annandale-on-Hudson"
        data-taxonomy="opera, mozart, bard music festival"
        data-price="25"
      >
        <time datetime="2026-08-16T15:00:00-04:00">August 16</time>
        <h3><a href="/events/bmf26-p11/">Program Eleven • Mozart's Abduction from the Seraglio</a></h3>
        <span data-venue>Fisher Center, Sosnoff Theater</span>
        <a class="button" href="/events/bmf26-p11/">Buy Tickets</a>
      </article>
      <article class="event-card" data-calendar-event data-title="Incomplete Fisher listing">
        <h3>Incomplete Fisher listing</h3>
      </article>
    </section>
  </body>
</html>
`;

export const basilicaHudsonHtmlCalendarFixture = `
<!doctype html>
<html lang="en">
  <head>
    <title>Basilica Hudson events fixture</title>
  </head>
  <body>
    <section aria-label="Upcoming Events">
      <article
        class="event-card"
        data-calendar-event
        data-title="WEDNESDAY"
        data-start="2026-07-22T20:00:00-04:00"
        data-url="/events/wednesday/"
        data-ticket-url="/events/wednesday/"
        data-taxonomy="concert, rock"
      >
        <time datetime="2026-07-22T20:00:00-04:00">July 22</time>
        <h3><a href="/events/wednesday/">WEDNESDAY</a></h3>
      </article>
      <article
        class="event-card"
        data-calendar-event
        data-title="HOUNDMOUTH"
        data-start="2026-08-04T20:00:00-04:00"
        data-url="/events/houndmouth/"
        data-ticket-url="/events/houndmouth/"
        data-taxonomy="concert, rock"
      >
        <time datetime="2026-08-04T20:00:00-04:00">August 4</time>
        <h3><a href="/events/houndmouth/">HOUNDMOUTH</a></h3>
      </article>
      <article
        class="event-card"
        data-calendar-event
        data-title="Soundscape Presents: Boy Harsher"
        data-start="2026-09-25T20:00:00-04:00"
        data-url="/events/soundscape-presents-boy-harsher/"
        data-ticket-url="/events/soundscape-presents-boy-harsher/"
        data-taxonomy="electronic, concert, darkwave"
      >
        <time datetime="2026-09-25T20:00:00-04:00">September 25</time>
        <h3><a href="/events/soundscape-presents-boy-harsher/">Soundscape Presents: Boy Harsher</a></h3>
      </article>
      <article
        class="event-card"
        data-calendar-event
        data-title="SUGAR"
        data-start="2026-10-18T20:00:00-04:00"
        data-url="/events/sugar/"
        data-ticket-url="/events/sugar/"
        data-taxonomy="concert, rock"
      >
        <time datetime="2026-10-18T20:00:00-04:00">October 18</time>
        <h3><a href="/events/sugar/">SUGAR</a></h3>
      </article>
      <article
        class="event-card"
        data-calendar-event
        data-title="SLEEP"
        data-start="2026-11-13T20:00:00-05:00"
        data-url="/events/sleep/"
        data-ticket-url="/events/sleep/"
        data-taxonomy="concert, metal"
      >
        <time datetime="2026-11-13T20:00:00-05:00">November 13</time>
        <h3><a href="/events/sleep/">SLEEP</a></h3>
      </article>
      <article class="event-card" data-calendar-event data-start="2026-12-01T20:00:00-05:00">
        <span class="date-only">December 1</span>
      </article>
    </section>
  </body>
</html>
`;

export const htmlCalendarFixturesBySourceId: Record<string, string> = {
  "hudson-arts-calendar": hudsonHallHtmlCalendarFixture,
  "hudson-fisher-center-calendar": fisherCenterHtmlCalendarFixture,
  "hudson-basilica-calendar": basilicaHudsonHtmlCalendarFixture
};
