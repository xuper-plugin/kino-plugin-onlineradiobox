// The person's country: a setting, or Automatic, which reads Kino's language ("es-CO"). The codes are the site's own paths.

export const COUNTRIES = [
  ["co", "Colombia", "Colombia"], ["mx", "México", "Mexico"], ["es", "España", "Spain"], ["ar", "Argentina", "Argentina"],
  ["cl", "Chile", "Chile"], ["pe", "Perú", "Peru"], ["ve", "Venezuela", "Venezuela"], ["ec", "Ecuador", "Ecuador"],
  ["bo", "Bolivia", "Bolivia"], ["uy", "Uruguay", "Uruguay"], ["py", "Paraguay", "Paraguay"], ["gt", "Guatemala", "Guatemala"],
  ["cr", "Costa Rica", "Costa Rica"], ["pa", "Panamá", "Panama"], ["do", "República Dominicana", "Dominican Republic"],
  ["cu", "Cuba", "Cuba"], ["us", "Estados Unidos", "United States"], ["br", "Brasil", "Brazil"], ["uk", "Reino Unido", "United Kingdom"],
  ["fr", "Francia", "France"], ["de", "Alemania", "Germany"], ["it", "Italia", "Italy"], ["pt", "Portugal", "Portugal"],
];

// "" = the whole world.
export function country() {
  const s = kino.config.get("country");
  if (s === "all") return "";
  if (typeof s === "string" && s !== "auto" && s) return COUNTRIES.some((c) => c[0] === s) ? s : "";
  const m = /^[a-z]{2}[-_]([A-Za-z]{2})\b/.exec(String(kino.lang || ""));
  const code = m ? m[1].toLowerCase() : "";
  const mapped = code === "gb" ? "uk" : code;
  return COUNTRIES.some((c) => c[0] === mapped) ? mapped : "";
}
