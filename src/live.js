// The radio in Kino's En vivo tab: categories (popular, genres, countries), the stations of one, and the search.

import { getHtml, listPage, playButtons, channelOf } from "./site.js";
import { t } from "./i18n.js";
import { country, COUNTRIES } from "./prefs.js";
import { GENRES, genreTitle } from "./catalog.js";

// Kino's closed vocabulary for the genres that have one.
const KIND = { pop: "musica", rock: "musica", latin: "musica", salsa: "musica", reggaeton: "musica", vallenato: "musica", merengue: "musica", bachata: "musica", cumbia: "musica", balada: "musica", jazz: "musica", classical: "musica", electronic: "musica", hip_hop: "musica", country: "musica", news: "noticias", sports: "deportes", talk: "noticias" };

export async function liveCategories() {
  const es = String(kino.lang || "").toLowerCase().startsWith("es");
  const cats = [{ id: "top", title: country() ? t("row_top") : t("row_topWorld"), genre: "musica" }];
  for (const g of GENRES) {
    const cat = { id: "genre-" + g, title: genreTitle(g) };
    if (KIND[g]) cat.genre = KIND[g];
    cats.push(cat);
  }
  for (const [code, nameEs, nameEn] of COUNTRIES) cats.push({ id: "country-" + code, title: es ? nameEs : nameEn, country: code.toUpperCase() });
  return cats;
}

// The site path a category stands for.
function pathOf(categoryId) {
  const id = String(categoryId || "");
  const cc = country();
  if (id === "top") return cc ? `/${cc}/` : "/genre/pop/";
  const g = /^genre-([a-z0-9_]+)$/.exec(id);
  if (g && GENRES.includes(g[1])) return cc ? `/${cc}/genre/${g[1]}/` : `/genre/${g[1]}/`;
  const c = /^country-([a-z]{2})$/.exec(id);
  if (c && COUNTRIES.some((x) => x[0] === c[1])) return `/${c[1]}/`;
  return null;
}

export async function liveChannels({ categoryId, cursor }) {
  const path = pathOf(categoryId);
  if (!path) throw kino.error("not_found", `unknown category ${String(categoryId).slice(0, 40)}`);
  const page = Math.max(1, parseInt(cursor || "1", 10) || 1);
  const items = (await listPage(path, page)).map(channelOf).filter(Boolean);
  return items.length >= 20 ? { items, next: String(page + 1) } : { items };
}

export async function liveSearch({ query }) {
  const q = String(query || "").trim();
  if (!q) return { items: [] };
  return { items: playButtons(await getHtml("/search/?q=" + encodeURIComponent(q))).map(channelOf).filter(Boolean) };
}
