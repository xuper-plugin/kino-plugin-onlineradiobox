// Offline tests of the Online Radio Box plugin: a stand-in `kino` answers with HTML shaped like onlineradiobox.com's lists.
import { test } from "node:test";
import assert from "node:assert/strict";

const BUTTON = (id, name, stream, type = "mp3") =>
  `<li class="stations__station" role="listitem" radioID="1"><button listeners="9" class="b-play station_play" aria-label="En Vivo" stream="${stream}" streamType="${type}" radioId="${id}" radioImg="//cdn.onlineradiobox.com/img/l/4/1.png" radioName="${name}"></button></li>`;
const PAGE = (...buttons) => `<ul id="stations">${buttons.join("\n")}</ul>`;

const calls = [];
const pages = new Map();
globalThis.kino = {
  lang: "es-CO",
  config: { get: () => undefined },
  log: () => {},
  error: (code, message, extra) => Object.assign(new Error(message), { code, ...extra }),
  fetch: async (url) => {
    calls.push(url);
    for (const [part, body] of pages) {
      if (url.endsWith(part)) return body === 404 ? { ok: false, status: 404 } : { ok: true, status: 200, text: () => body };
    }
    return { ok: false, status: 500 };
  },
};

const { search, browse, resolve, home } = await import("../src/catalog.js");
const { liveChannels, liveCategories, liveSearch } = await import("../src/live.js");
const { playButtons, decode, pathOf, isStationId } = await import("../src/site.js");

test("entities and station ids", () => {
  assert.equal(decode("Caracol &amp; Co &#039;en vivo&#039; &#xE9;"), "Caracol & Co 'en vivo' é");
  assert.ok(isStationId("co.caracolbogota"));
  assert.ok(!isStationId("../x"));
  assert.equal(pathOf("co.caracolbogota"), "/co/caracolbogota/");
});

test("a list page becomes buttons with https logos and a stream; a duplicate or a bad id is dropped", () => {
  const html = PAGE(BUTTON("co.a", "A &amp; B", "https://s.example/a.aac"), BUTTON("co.a", "again", "https://s.example/x"), BUTTON("bad id", "X", "https://s.example/b"), BUTTON("co.hls", "H", "https://s.example/h", "hls"));
  const b = playButtons(html);
  assert.deepEqual(b.map((x) => x.id), ["co.a", "co.hls"]);
  assert.equal(b[0].name, "A & B");
  assert.equal(b[0].logo, "https://cdn.onlineradiobox.com/img/l/4/1.png");
  assert.equal(b[1].hls, true);
});

test("the country comes from Kino's language; a full page has a next cursor", async () => {
  calls.length = 0;
  pages.clear();
  pages.set("/co/", PAGE(...Array.from({ length: 25 }, (_, i) => BUTTON("co.s" + i, "S" + i, "https://s.example/" + i))));
  const page = await liveChannels({ categoryId: "top", cursor: null });
  assert.equal(page.items.length, 25);
  assert.equal(page.next, "2");
  assert.deepEqual(page.items[0].stream, { url: "https://s.example/0" });
  assert.equal(calls[0], "https://onlineradiobox.com/co/");
});

test("page 2 uses ?p=1, a genre filters inside the country, and a page past the end is empty", async () => {
  calls.length = 0;
  pages.clear();
  pages.set("/co/genre/salsa/?p=1", PAGE(BUTTON("co.z", "Z", "https://s.example/z")));
  pages.set("/co/genre/salsa/?p=2", 404);
  const page = await liveChannels({ categoryId: "genre-salsa", cursor: "2" });
  assert.equal(page.items.length, 1);
  assert.equal(page.next, undefined);
  assert.deepEqual((await liveChannels({ categoryId: "genre-salsa", cursor: "3" })).items, []);
  await assert.rejects(() => liveChannels({ categoryId: "nope", cursor: null }), { code: "not_found" });
});

test("categories: popular, genres and countries, unique ids", async () => {
  const cats = await liveCategories();
  assert.equal(cats[0].id, "top");
  assert.ok(cats.some((c) => c.id === "genre-news" && c.genre === "noticias"));
  assert.ok(cats.some((c) => c.id === "country-mx" && c.title === "México"));
  assert.equal(new Set(cats.map((c) => c.id)).size, cats.length);
});

test("search returns live items; liveSearch returns channels", async () => {
  pages.clear();
  pages.set("/search/?q=salsa", PAGE(BUTTON("us.salsa24", "Salsa 24", "https://s.example/s")));
  const items = await search({ q: "salsa" });
  assert.deepEqual(items.map((i) => [i.kind, i.ref, i.title]), [["live", "st:us.salsa24", "Salsa 24"]]);
  assert.equal((await liveSearch({ query: "salsa" })).items[0].id, "us.salsa24");
  assert.deepEqual(await search({ q: " " }), []);
});

test("home has a row for the country and a few genres, leaving out a failing one", async () => {
  pages.clear();
  pages.set("/co/", PAGE(BUTTON("co.a", "A", "https://s.example/a")));
  pages.set("/co/genre/news/", PAGE(BUTTON("co.n", "N", "https://s.example/n")));
  const rows = await home();
  assert.deepEqual(rows.map((r) => r.id), ["top", "genre-news"]);
});

test("browse pages a list, and rejects an unknown one", async () => {
  pages.clear();
  pages.set("/co/", PAGE(...Array.from({ length: 20 }, (_, i) => BUTTON("co.s" + i, "S" + i, "https://s.example/" + i))));
  assert.equal((await browse("top", null)).next, "2");
  await assert.rejects(() => browse("what", null), { code: "not_found" });
});

test("resolve reads the station's own page, marks HLS, and fails clearly", async () => {
  pages.clear();
  pages.set("/co/a/", PAGE(BUTTON("co.a", "A", "https://s.example/a.aac")));
  pages.set("/co/h/", PAGE(BUTTON("co.h", "H", "https://s.example/h", "hls")));
  pages.set("/co/none/", PAGE(BUTTON("co.other", "O", "https://s.example/o")));
  assert.equal((await resolve("st:co.a")).url, "https://s.example/a.aac");
  assert.equal((await resolve("st:co.h")).mime, "application/x-mpegURL");
  await assert.rejects(() => resolve("st:co.none"), { code: "not_found" });
  await assert.rejects(() => resolve("st:../x"), { code: "not_found" });
});
