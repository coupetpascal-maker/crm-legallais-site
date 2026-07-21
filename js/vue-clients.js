// Portefeuille clients : recherche, tri, table complète au design system.
// Le clic sur une ligne ouvre la fiche (side panel). Lecture seule.
import { etat, LIBELLES, CANAUX } from "./donnees.js";
import { icone } from "./icons.js";
import { ouvrirFiche } from "./fiche-panel.js";

const euros = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
const compact = (n) => !n ? "—" : n >= 1e6 ? (n / 1e6).toFixed(2).replace(".", ",") + " M€"
  : Math.round(n / 1e3) + " k€";

// État local de la vue (conservé entre rendus).
let recherche = "";
let tri = "score";
let famille = ""; // filtre famille exact (clic depuis la répartition du dashboard)

function initiales(nom) {
  const mots = nom.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/);
  return ((mots[0]?.[0] || "") + (mots[1]?.[0] || mots[0]?.[1] || "")).toUpperCase();
}

function ligne(c, scoreMax) {
  const pct = Math.min(100, Math.round((c.score / scoreMax) * 100));
  return `<tr data-compte="${c.compte}">
    <td><div class="client-cell">
      <div class="ico-square">${initiales(c.nom)}</div>
      <div><div class="nm">${c.nom}</div><div class="sec">${c.ville || "—"} · ${c.famille || "—"}</div></div>
    </div></td>
    <td>${CANAUX[c.canal] || "—"}</td>
    <td class="num">${c.date_derniere_cmde || "—"}</td>
    <td class="num">${euros(c.ca_n)}</td>
    <td><span class="badge ${c.niveau}"><span class="dot"></span>${LIBELLES[c.motif] || c.motif}</span></td>
    <td><span class="score-chip ${c.niveau}"><span class="bar"><i style="width:${pct}%"></i></span>${compact(c.score)}</span></td>
  </tr>`;
}

// `params.recherche` = recherche globale (topbar) ; `params.famille` = clic sur
// une famille dans la répartition du dashboard. Chacun réinitialise l'autre pour
// éviter deux filtres cumulés involontaires.
export function vueClients(canvas, params = {}) {
  if (params.famille !== undefined) { famille = params.famille; recherche = ""; }
  if (params.recherche !== undefined) { recherche = params.recherche; famille = ""; }

  const q = recherche.toLowerCase();
  let liste = etat.clients.filter((c) =>
    (famille === "" || c.famille === famille) &&
    (c.nom + " " + (c.ville || "") + " " + (c.famille || "")).toLowerCase().includes(q));
  liste.sort((a, b) => (b[tri] || 0) - (a[tri] || 0));
  const scoreMax = etat.clients.reduce((m, c) => Math.max(m, c.score || 0), 1);
  const affichees = liste.slice(0, 200);

  // Puces de filtre par famille (« Toutes » + une par famille, triées par nombre
  // de clients). Barre scrollable horizontalement → filtrable au doigt sur iPhone.
  const parFam = new Map();
  for (const c of etat.clients) parFam.set(c.famille || "—", (parFam.get(c.famille || "—") || 0) + 1);
  const famItems = [["", "Toutes", etat.clients.length],
    ...[...parFam.entries()].sort((a, b) => b[1] - a[1]).map(([f, n]) => [f, f, n])];
  const famChips = famItems.map(([val, label, n]) =>
    `<button class="chip ${famille === val ? "active" : ""}" data-fam-chip="${val}">${label} <span class="c">${n}</span></button>`).join("");

  canvas.innerHTML = `
    <h1 class="crm-h1">Clients <span class="sub">${etat.clients.length} au portefeuille</span></h1>
    <div class="crm-card" style="flex:1;min-height:0">
      <div class="crm-card-head">
        <div class="crm-search" style="flex:1;max-width:420px">
          ${icone("search", "ico")}
          <input id="recherche-clients" placeholder="Rechercher nom, ville, famille…" value="${recherche}">
        </div>
        <span class="count">${liste.length} résultat${liste.length > 1 ? "s" : ""}</span>
        <div class="head-actions">
          <div class="chip-row">
            <button class="chip ${tri === "score" ? "active" : ""}" data-tri="score">Par enjeu</button>
            <button class="chip ${tri === "ca_n" ? "active" : ""}" data-tri="ca_n">Par CA</button>
          </div>
        </div>
      </div>
      <div class="chip-row" style="overflow-x:auto;flex-wrap:nowrap;gap:6px;padding:2px 16px 12px;-webkit-overflow-scrolling:touch">
        ${famChips}
      </div>
      <div style="overflow:auto;min-height:0">
        <table class="crm-table">
          <thead><tr>
            <th>Client</th><th>Canal</th><th>Dern. commande</th>
            <th>CA</th><th>Motif</th><th>Enjeu</th>
          </tr></thead>
          <tbody>${affichees.map((c) => ligne(c, scoreMax)).join("")}</tbody>
        </table>
        ${liste.length > 200 ? `<p class="message-central">${liste.length - 200} autres — affine ta recherche.</p>` : ""}
      </div>
    </div>`;

  // Recherche (conserve le focus et la position du curseur).
  const champ = canvas.querySelector("#recherche-clients");
  champ.addEventListener("input", (e) => {
    recherche = e.target.value;
    vueClients(canvas);
    const c2 = canvas.querySelector("#recherche-clients");
    c2.focus();
    c2.setSelectionRange(c2.value.length, c2.value.length);
  });

  // Filtre par famille (puces) — « Toutes » = data-fam-chip vide → famille = "".
  canvas.querySelectorAll("[data-fam-chip]").forEach((b) =>
    b.addEventListener("click", () => { famille = b.dataset.famChip; vueClients(canvas); }));

  // Tri.
  canvas.querySelectorAll("[data-tri]").forEach((b) =>
    b.addEventListener("click", () => { tri = b.dataset.tri; vueClients(canvas); }));

  // Clic ligne → fiche.
  canvas.querySelectorAll(".crm-table tbody tr").forEach((tr) =>
    tr.addEventListener("click", () => ouvrirFiche(tr.dataset.compte)));
}
