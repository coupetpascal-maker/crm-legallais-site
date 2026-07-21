// Vue terrain tactile — « Tournée du jour » (handoff Version A « Direct »).
// Plein écran, alimentée par le plan réel (etat.plan) et les KPIs réels.
// Cible : iPhone sur le terrain (responsive 1 colonne) ; PC garde le shell desktop.
import { etat, LIBELLES, jourDuPlan, prochainJour, aujourdHuiIso } from "./donnees.js";
import { ouvrirFiche } from "./fiche-panel.js";
import { recontactPourJour } from "./recontact.js";

const compact = (n) => !n ? "—" : n >= 1e6 ? (n / 1e6).toFixed(2).replace(".", ",") + " M€"
  : Math.round(n / 1e3) + " k€";
const JOURS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function initiales(nom) {
  const mots = nom.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/);
  return ((mots[0]?.[0] || "") + (mots[1]?.[0] || mots[0]?.[1] || "")).toUpperCase();
}

const ICON = {
  burger: "M3 6h18M3 12h18M3 18h18", chev: "M6 9l6 6 6-6",
  filter: "M3 4h18l-7 9v6l-4 2v-8L3 4z", navi: "M3 11l19-9-9 19-2-8-8-2z",
  dash: "M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10",
  tour: "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  users: "M16 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  calendar: "M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4",
  map: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14",
};
const sv = (n, w = 22) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[n]}"/></svg>`;

// Bandeau KPI (4 indicateurs réels).
function kpiStrip() {
  const cs = etat.clients;
  const caN = cs.reduce((s, c) => s + (c.ca_n || 0), 0);
  const caN1 = cs.reduce((s, c) => s + (c.ca_n1 || 0), 0);
  const vmb = cs.reduce((s, c) => s + (c.vmb || 0), 0);
  const enjeu = cs.reduce((s, c) => s + (c.score || 0), 0);
  const prioritaires = cs.filter((c) => c.niveau === "hi").length;
  const deltaCA = caN1 > 0 ? Math.round(((caN - caN1) / caN1) * 100) : 0;
  const tauxVMB = caN > 0 ? (vmb / caN) * 100 : 0;

  return `<div class="t-kpi-strip">
    <div class="t-kpi"><div class="lbl">CA année en cours</div>
      <div class="v">${compact(caN)}</div>
      <div class="delta ${deltaCA >= 0 ? "up" : ""}">${deltaCA >= 0 ? "▲ +" : "▼ "}${deltaCA} % vs N-1</div></div>
    <div class="t-kpi"><div class="lbl">VMB · marge brute</div>
      <div class="v">${tauxVMB.toFixed(1).replace(".", ",")}<small> %</small></div>
      <div class="delta">${compact(vmb)} de marge</div></div>
    <div class="t-kpi"><div class="lbl">Clients prioritaires</div>
      <div class="v">${prioritaires}<small> clients</small></div>
      <div class="delta" style="color:#d33a2a">● priorité élevée</div></div>
    <div class="t-kpi"><div class="lbl">Enjeu identifié</div>
      <div class="v">${compact(enjeu)}</div>
      <div class="delta">potentiel à récupérer</div></div>
  </div>`;
}

// Carte d'une visite (ordre de passage `i`, client `c`).
function visitCard(c, i) {
  return `<div class="t-visit" data-compte="${c.compte}">
    <div class="v-time">
      <div class="when">#${i + 1}</div>
      <div class="dur">${initiales(c.nom)}</div>
      <div class="pri ${c.niveau}">${compact(c.score).replace(/\s?[€%].*/, "")}</div>
    </div>
    <div class="v-main">
      <div class="v-name">${c.nom}</div>
      <div class="v-meta"><span>${c.ville || "—"}</span><span class="pip"></span><span>${c.famille || LIBELLES[c.motif] || ""}</span></div>
      <div class="v-stats"><span>CA n : <b>${compact(c.ca_n)}</b></span><span>CA n-1 : <b>${compact(c.ca_n1)}</b></span></div>
    </div>
    <div class="v-actions">
      <a class="t-act primary" target="_blank" href="https://maps.apple.com/?daddr=${encodeURIComponent(c.adresse || c.ville || "")}">
        ${sv("navi", 14)}<span>Itinéraire</span></a>
      <button class="t-act" data-fiche="${c.compte}">Ouvrir fiche</button>
    </div>
  </div>`;
}

// Corps « Tournée du jour » : KPI strip + cartes de visite, rendu dans le canvas
// mobile (route "terrain"). Signature identique aux autres vues → routable.
export function vueTournee(canvas) {
  const dateIso = aujourdHuiIso();
  const jour = jourDuPlan(dateIso) || prochainJour(dateIso);

  const recontactClients = recontactPourJour(etat.parCompte, etat.plan, jour);
  const blocSet = new Set(recontactClients.map((c) => c.compte));

  // Tournée planifiée, moins les clients déjà dans le bloc « À recontacter » (affichés ce jour).
  const comptes = (jour ? jour.visites : []).filter((cp) => !blocSet.has(cp));
  const clients = comptes.map((cp) => etat.parCompte.get(cp)).filter(Boolean);

  const d = jour ? new Date(jour.date + "T12:00:00") : null;
  const titreJour = d ? `${JOURS_FR[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}` : "Aucune tournée";
  const sousTitre = jour
    ? `— ${clients.length} visite${clients.length > 1 ? "s" : ""}${jour.zone ? " · " + jour.zone : ""}`
    : "Pas de tournée planifiée";

  const cartes = clients.length
    ? clients.map(visitCard).join("")
    : `<div class="message-central" style="grid-column:1/-1">Aucune visite planifiée pour le moment.</div>`;

  const blocRecontact = recontactClients.length
    ? `<div class="t-recontact">
        <div class="t-recontact-head"><span class="dot"></span>À recontacter <span class="n">(${recontactClients.length})</span></div>
        <div class="t-visits">${recontactClients.map(visitCard).join("")}</div>
      </div>`
    : "";

  canvas.innerHTML = `
    ${kpiStrip()}
    ${blocRecontact}
    <div class="t-sec-head"><h2>${titreJour}</h2><span class="sub">${sousTitre}</span>
      <span class="t-sec-spacer"></span>
      <button class="t-filter">${sv("filter", 14)}<span>Filtrer</span></button></div>
    <div class="t-visits">${cartes}</div>`;

  // Pastille de l'onglet « Tournée du jour » = ce qui est réellement affiché
  // (à recontacter + planifié dédupliqué). Le shell survit aux re-render du canvas,
  // donc la pastille reste à jour après un cocher/décocher.
  const cnt = document.querySelector(".t-tab .count");
  if (cnt) cnt.textContent = recontactClients.length + clients.length;

  // Ouvrir fiche : clic sur la carte ou le bouton « Ouvrir fiche ».
  canvas.querySelectorAll(".t-visit").forEach((card) =>
    card.addEventListener("click", (e) => {
      if (e.target.closest(".t-act.primary")) return; // lien itinéraire : on laisse passer
      ouvrirFiche(card.dataset.compte);
    }));
}

// Monte le shell terrain plein écran (header + onglets + bottom nav) dans #app et
// renvoie le .t-body (= canvas). La nav (onglets + bottom nav) route via onRoute :
// tout élément [data-route] bascule la vue affichée dans le canvas.
export function monterTerrain(onRoute) {
  const jour = jourDuPlan(aujourdHuiIso()) || prochainJour(aujourdHuiIso());
  const recontactJour = recontactPourJour(etat.parCompte, etat.plan, jour);
  const blocSet = new Set(recontactJour.map((c) => c.compte));
  const planifie = (jour ? jour.visites : []).filter((cp) => !blocSet.has(cp)).length;
  const nbVisites = recontactJour.length + planifie;

  const bnav = [
    ["dash", "Tableau", "dashboard"], ["tour", "Tournée", "terrain"],
    ["users", "Clients", "clients"], ["calendar", "Visites", "jour"],
    ["map", "Carte", "carte"],
  ].map(([ic, l, route]) =>
    `<div class="t-bnav-item" data-route="${route}">${sv(ic)}<span>${l}</span></div>`).join("");

  const app = document.getElementById("app");
  app.innerHTML = `<div class="crm-tablet theme-direct">
    <div class="t-header">
      <button class="t-burger">${sv("burger")}</button>
      <div class="t-brand"><div class="mark">CL</div><div class="wm">CRM LEGALLAIS</div></div>
      <span class="t-spacer"></span>
      <div class="t-ctx-chip"><span>Tournées</span>${sv("chev", 16)}</div>
      <span class="t-spacer"></span>
      <div class="t-sync"><span class="dot"></span><span>Données du ${etat.genereLe || "—"}</span></div>
      <div class="t-avatar">PC</div>
    </div>
    <div class="t-tabs">
      <button class="t-tab" data-route="dashboard">Tableau</button>
      <button class="t-tab" data-route="terrain">Tournée du jour <span class="count">${nbVisites}</span></button>
      <button class="t-tab" data-route="clients">Clients</button>
      <button class="t-tab" data-route="jour">Visites</button>
    </div>
    <div class="t-body"></div>
    <div class="t-bnav">${bnav}</div>
  </div>`;

  // Délégation sur le wrapper (recréé à chaque montage → pas de listener empilé).
  const wrap = app.querySelector(".crm-tablet");
  wrap.addEventListener("click", (e) => {
    const cible = e.target.closest("[data-route]");
    if (cible) onRoute(cible.dataset.route);
  });

  return wrap.querySelector(".t-body");
}
