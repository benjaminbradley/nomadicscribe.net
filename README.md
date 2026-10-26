# nomadicscribe.net

An archive of NomadicScribe.net, the travel blog, wiki and map that April and Benjamin kept while visiting intentional communities in 2005–2007. The site is now a flat static copy served by GitHub Pages from `docs/`.

It was captured from the old PHP/WordPress/MediaWiki hosting, cleaned of dynamic features, had its links made relative, and was verified so that every internal link resolves.

Visible changes from the original:

- The blog and wiki subdomains now live at `/blog/` and `/wiki/`.
- Search, login, comment forms, feeds, trackbacks, wiki edit/history links and the mailing-list signup were removed. Links to pages that no longer exist were unwrapped, leaving the text.
- The blog footer now reads "no longer powered by WordPress".
- The header's contact links now point to the contact form at https://wegeekout.com/contact-me/. The PHP "current location" box was removed.
- The map is now a Leaflet/OpenStreetMap map (no API key), and the calendar is rendered in the browser from `maps/mapdata.xml`.
- PayPal donate buttons were removed.
