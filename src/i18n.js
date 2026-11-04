// Every text the person reads, in Spanish and English: Kino does not translate a plugin's texts. An error's sentence
// names no domain and not the app: Kino hides a sentence that does and shows its own generic one.

const TEXTS = {
  es: {
    unavailable: "La radio no responde ahora. Intenta de nuevo en un rato.",
    noStream: "Esta emisora no tiene transmisión disponible.",
    row_top: "Emisoras populares", row_topWorld: "Emisoras del mundo",
    genre_pop: "Pop", genre_rock: "Rock", genre_news: "Noticias", genre_latin: "Latina", genre_salsa: "Salsa",
    genre_reggaeton: "Reguetón", genre_vallenato: "Vallenato", genre_merengue: "Merengue", genre_bachata: "Bachata",
    genre_cumbia: "Cumbia", genre_jazz: "Jazz", genre_classical: "Clásica", genre_electronic: "Electrónica",
    genre_hip_hop: "Hip hop", genre_country: "Country", genre_christian: "Cristiana", genre_sports: "Deportes",
    genre_talk: "Charla", genre_oldies: "Clásicos", genre_balada: "Baladas", genre_tropical: "Tropical",
    live: "En vivo",
  },
  en: {
    unavailable: "The radio isn't answering right now. Try again in a while.",
    noStream: "This station has no stream available.",
    row_top: "Popular stations", row_topWorld: "Stations from around the world",
    genre_pop: "Pop", genre_rock: "Rock", genre_news: "News", genre_latin: "Latin", genre_salsa: "Salsa",
    genre_reggaeton: "Reggaeton", genre_vallenato: "Vallenato", genre_merengue: "Merengue", genre_bachata: "Bachata",
    genre_cumbia: "Cumbia", genre_jazz: "Jazz", genre_classical: "Classical", genre_electronic: "Electronic",
    genre_hip_hop: "Hip hop", genre_country: "Country", genre_christian: "Christian", genre_sports: "Sports",
    genre_talk: "Talk", genre_oldies: "Oldies", genre_balada: "Ballads", genre_tropical: "Tropical",
    live: "Live",
  },
};

export function t(key, vars) {
  const lang = String(kino.lang || "").toLowerCase().startsWith("es") ? "es" : "en";
  const template = TEXTS[lang][key] || TEXTS.es[key] || key;
  return vars ? template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k])) : template;
}
