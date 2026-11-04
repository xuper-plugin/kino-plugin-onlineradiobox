# Online Radio Box

A [Kino](https://github.com/kinotvapp/kino-plugin-archive) plugin for [Online Radio Box](https://onlineradiobox.com): live radio from thousands of stations.

- Stations appear in Kino's **En vivo** tab: popular ones in your country, 20 genres and 23 countries, plus the En vivo search.
- They also show in Kino's search and in its Home.
- **Settings**: the stations' country. Automatic reads Kino's language (`es-CO` → Colombia).

The site has no API: the plugin reads its HTML lists (`/co/`, `/co/genre/salsa/`, `/search/?q=`). Each station in a list carries its stream,
so a channel plays without another request; opening one by its own page is the fallback.

## Hosts

`onlineradiobox.com` and `*.onlineradiobox.com` (the pages and the logos). The streams come from each station's own server
(StreamTheWorld, Icecast…), so the manifest asks for `liveStreamHosts: "any"`; the person approves it on the consent sheet.
`kino.fetch` still reaches only Online Radio Box.

## Develop

The code lives in `src/` (`src/plugin.js` only re-exports); `npm run build` bundles it into `plugin.js`, the one file Kino installs.
Commit `plugin.js` and never edit it by hand.

```
npm install
npm run build
npm run check:built
node sdk/validate.mjs .
npm test
node sdk/run.mjs . live channels top
node sdk/run.mjs --live ./plugin.js resolve st:co.caracolbogota
```
