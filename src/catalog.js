// What Kino asks for besides live channels: search, home, browse and resolve.

import { getHtml, listPage, playButtons, stationItem, streamOf, pathOf, isStationId } from "./site.js";
import { t } from "./i18n.js";
import { country } from "./prefs.js";

export const GENRES = ["pop", "rock", "news", "latin", "salsa", "reggaeton", "vallenato", "merengue", "bachata", "cumbia", "balada", "jazz", "classical", "electronic", "hip_hop", "country", "christian", "sports", "talk", "oldies"];

// Kino allows 6 fetches in flight per plugin: never start more than `limit` at once.
async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const i = next++;
      out[i] = await fn(list[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}

export function genreTitle(genre) {
  return t("genre_" + genre);
}

// The site path a list ref stands for: "top" (the person's country; with none, the world's pop stations) and "genre:<slug>"
// (that genre in the country, or worldwide).
export function pathOfList(ref) {
  const cc = country();
  const s = String(ref || "");
  if (s === "top") return cc ? `/${cc}/` : "/genre/pop/";
  const m = /^genre:([a-z0-9_]{1,30})$/.exec(s);
  if (m && GENRES.includes(m[1])) return cc ? `/${cc}/genre/${m[1]}/` : `/genre/${m[1]}/`;
  return null;
}

async function listItems(ref, page) {
  const path = pathOfList(ref);
  if (!path) throw kino.error("not_found", `unknown list ${String(ref).slice(0, 60)}`);
  return (await listPage(path, page)).map(stationItem).filter(Boolean);
}

// One row, or null: a row the site fails to answer is logged and left out, never taking the others with it.
async function rowOf(id, ref, title) {
  try {
    const items = (await listItems(ref, 1)).slice(0, 30);
    return items.length ? { id, title, ref, items } : null;
  } catch (e) {
    kino.log(`row ${id} failed: ${e && e.message}`);
    return null;
  }
}

export async function search(query) {
  const q = String(query.q || "").trim();
  if (!q) return [];
  const html = await getHtml("/search/?q=" + encodeURIComponent(q));
  return playButtons(html).map(stationItem).filter(Boolean);
}

export async function home() {
  const plan = [["top", "top", country() ? t("row_top") : t("row_topWorld")]];
  for (const g of ["news", "pop", "salsa", "rock"]) plan.push([`genre-${g}`, `genre:${g}`, genreTitle(g)]);
  return (await mapLimit(plan, 3, (r) => rowOf(...r))).filter(Boolean);
}

// A page is 20 or 25 stations: a page with any station may have a next one; an empty page is the end.
export async function browse(ref, cursor) {
  const page = Math.max(1, parseInt(cursor || "1", 10) || 1);
  const items = await listItems(ref, page);
  return items.length >= 20 ? { items, next: String(page + 1) } : { items };
}

export async function resolve(ref) {
  const m = /^st:(.+)$/.exec(String(ref || ""));
  const path = m && isStationId(m[1]) ? pathOf(m[1]) : null;
  if (!path) throw kino.error("not_found", `unknown ref ${String(ref).slice(0, 80)}`);
  const button = playButtons(await getHtml(path)).find((b) => b.id === m[1]);
  if (!button || !button.stream) throw kino.error("not_found", `${m[1]} has no stream`, { userMessage: t("noStream") });
  return { ...streamOf(button), label: t("live"), expiresInSeconds: 600 };
}
