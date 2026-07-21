// Shell de l'application : sidebar noire + topbar + zone canvas.
// Source de vérité visuelle : docs/design/design_files (Version A « Direct »).
import { icone } from "./icons.js";
import { etat } from "./donnees.js";

// Items de navigation : { id, label, icone, badge? }. L'id sert de route.
const NAV = [
  { groupe: "Pilotage", items: [
    { id: "dashboard", label: "Tableau de bord", ic: "dashboard" },
    { id: "clients",   label: "Clients",         ic: "users" },
  ]},
  { groupe: "Terrain", items: [
    { id: "jour", label: "Tournée du jour", ic: "calendar" },
    { id: "carte",   label: "Carte",           ic: "map" },
  ]},
  { groupe: "Données", items: [
    { id: "import", label: "Importer CSV", ic: "upload" },
  ]},
];

// Construit le HTML de la sidebar.
function sidebar(actif) {
  const groupes = NAV.map((g) => {
    const items = g.items.map((it) => {
      const badge = it.badge ? `<span class="badge-num">${it.badge}</span>` : "";
      return `<div class="crm-nav-item ${it.id === actif ? "active" : ""}" data-route="${it.id}">
        ${icone(it.ic, "ico")}<span>${it.label}</span>${badge}</div>`;
    }).join("");
    return `<div class="group-label">${g.groupe}</div>${items}`;
  }).join("");

  return `<aside class="crm-sidebar">
    <div class="crm-brand">
      <div class="crm-brand-mark">CL</div>
      <div class="crm-brand-name">CRM Legallais<span>Tournées commerciales</span></div>
    </div>
    <nav class="crm-nav">${groupes}</nav>
    <div class="crm-sidebar-foot">
      <div class="crm-avatar">PC</div>
      <div class="who"><b>Pascal</b><div>Commercial terrain</div></div>
    </div>
  </aside>`;
}

// Construit le HTML de la topbar (recherche + actions).
function topbar() {
  return `<header class="crm-topbar">
    <button class="crm-month" data-action="month">
      ${icone("calendar", "ico")}<span id="topbar-mois">${etat.genereLe || "—"}</span>
      <span class="chev">${icone("chevron", "ico")}</span>
    </button>
    <div class="crm-search">
      ${icone("search", "ico")}
      <input id="recherche-globale" placeholder="Rechercher un client, une ville…">
      <span class="kbd">⌘K</span>
    </div>
    <div class="crm-topbar-right">
      <button class="btn" data-route="import">${icone("upload", "ico")}Importer CSV</button>
    </div>
  </header>`;
}

// Rend le shell complet dans #app et renvoie l'élément canvas (cible des vues).
export function monterShell(onRoute, onSearch) {
  const app = document.getElementById("app");
  app.innerHTML = `${sidebar("dashboard")}
    <div class="crm-main">${topbar()}<div class="crm-canvas" id="canvas"></div></div>`;

  // Navigation : tout élément avec data-route change de vue.
  app.addEventListener("click", (e) => {
    const cible = e.target.closest("[data-route]");
    if (cible) onRoute(cible.dataset.route);
  });

  // Recherche globale → vue Clients filtrée (live).
  const champ = document.getElementById("recherche-globale");
  champ.addEventListener("input", () => {
    onSearch(champ.value);
    document.getElementById("recherche-globale").focus();
  });

  // Raccourci ⌘K / Ctrl+K → focus recherche.
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      document.getElementById("recherche-globale")?.focus();
    }
  });

  return document.getElementById("canvas");
}

// Met à jour l'item de nav actif (sans reconstruire le shell).
// Couvre la sidebar desktop ET la nav mobile (onglets + bottom nav).
export function marquerActif(route) {
  document.querySelectorAll(".crm-nav-item, .t-tab, .t-bnav-item").forEach((el) =>
    el.classList.toggle("active", el.dataset.route === route));
}
