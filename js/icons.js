// Jeu d'icônes SVG inline (stroke 24×24) repris du handoff design.
// Usage : icone("calendar", "ico") → chaîne <svg> à insérer dans du HTML.
export const ICONS = {
  dashboard:  "M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10",
  users:      "M16 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 21v-1a4 4 0 0 0-3-3.87M17 4.13a4 4 0 0 1 0 7.75",
  calendar:   "M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4",
  map:        "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
  upload:     "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  chart:      "M3 21h18M7 17V9M12 17V5M17 17v-7",
  search:     "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  chevron:    "M6 9l6 6 6-6",
  chevronR:   "M9 18l6-6-6-6",
  plus:       "M12 5v14M5 12h14",
  close:      "M18 6 6 18M6 6l12 12",
  filter:     "M3 4h18l-7 9v6l-4 2v-8L3 4z",
  more:       "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  pin:        "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  euro:       "M14 6a4 4 0 0 0-4 4M10 14a4 4 0 0 0 4 4M5 10h7M5 14h7",
  csv:        "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M8 13h0M11 13h2M8 17h0M11 17h2",
  phone:      "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mail:       "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6 12 13 2 6",
  trend:      "M23 6 13.5 15.5 8.5 10.5 1 18M17 6h6v6",
  trendDown:  "M23 18 13.5 8.5 8.5 13.5 1 6M17 18h6v-6",
  check:      "M20 6 9 17l-5-5",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  alert:      "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h0",
  building:   "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9h0M9 13h0M9 17h0",
};

// Génère un <svg> inline. `cls` = classe CSS (ex. "ico"), `extra` = attributs sup.
export function icone(nom, cls = "ico", extra = "") {
  const d = ICONS[nom] || "";
  return `<svg class="${cls}" viewBox="0 0 24 24" ${extra}><path d="${d}"/></svg>`;
}
