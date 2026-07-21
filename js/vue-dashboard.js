// Tableau de bord : KPIs + table des clients prioritaires + répartition.
// Données réelles (fichier Unik) : pas de « région » ni « nb visites cible »,
// les KPIs sont donc adaptés au moteur additif (score en € d'enjeu).
import { etat, LIBELLES, CANAUX, dateFr } from "./donnees.js";
import { icone } from "./icons.js";
import { ouvrirFiche } from "./fiche-panel.js";
import { afficher } from "./app.js";

const euros = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
const compact = (n) => n >= 1e6 ? (n / 1e6).toFixed(2).replace(".", ",") + " M€"
  : Math.round(n / 1e3) + " k€";

// Initiales d'un nom (2 premières lettres significatives).
function initiales(nom) {
  const mots = nom.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/);
  return ((mots[0]?.[0] || "") + (mots[1]?.[0] || mots[0]?.[1] || "")).toUpperCase();
}

// Filtres actifs (chips par motif) + tri.
let motifActif = "tous";

function kpis() {
  const cs = etat.clients;
  const caN = cs.reduce((s, c) => s + (c.ca_n || 0), 0);
  const caN1 = cs.reduce((s, c) => s + (c.ca_n1 || 0), 0);
  const vmb = cs.reduce((s, c) => s + (c.vmb || 0), 0);
  const enjeu = cs.reduce((s, c) => s + (c.score || 0), 0);
  const prioritaires = cs.filter((c) => c.niveau === "hi").length;
  const deltaCA = caN1 > 0 ? Math.round(((caN - caN1) / caN1) * 100) : 0;
  const tauxVMB = caN > 0 ? (vmb / caN) * 100 : 0;

  const carte = (ic, label, valeur, bas) => `<div class="crm-kpi">
    <div class="kpi-icon">${icone(ic, "ico")}</div>
    <div class="label">${label}</div>
    <div class="value">${valeur}</div>${bas}</div>`;

  const delta = (v, suffixe) => `<div class="delta ${v >= 0 ? "up" : "down"}">
    ${icone(v >= 0 ? "trend" : "trendDown", "ico")} ${v >= 0 ? "+" : ""}${v}${suffixe}</div>`;

  return `<div class="crm-kpi-row">
    ${carte("euro", "CA année en cours", compact(caN), delta(deltaCA, " % vs N-1"))}
    ${carte("chart", "VMB · marge brute", tauxVMB.toFixed(1).replace(".", ",") + " %",
      `<div class="delta">${compact(vmb)} de marge</div>`)}
    ${carte("alert", "Clients prioritaires", prioritaires,
      `<div class="delta">priorité élevée · à visiter</div>`)}
    ${carte("trend", "Enjeu identifié", compact(enjeu),
      `<div class="delta">potentiel à récupérer</div>`)}
  </div>`;
}

// Une ligne de la table prioritaire.
function ligne(c) {
  const scoreMax = etat.clients[0]?.score || 1;
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
    <td><button class="btn primary sm" data-action="fiche" data-compte="${c.compte}">Infos client</button></td>
  </tr>`;
}

// Carte de droite : répartition par famille métier (remplace la carte régions,
// absente des données réelles).
function repartition() {
  const parFamille = new Map();
  for (const c of etat.clients) {
    const f = c.famille || "Autre";
    const o = parFamille.get(f) || { n: 0, ca: 0 };
    o.n++; o.ca += c.ca_n || 0;
    parFamille.set(f, o);
  }
  // Tri par nombre de clients décroissant (famille la plus importante en tête).
  const familles = [...parFamille.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8);
  const nMax = familles[0]?.[1].n || 1;
  // data-famille rend chaque ligne cliquable → vue Clients filtrée sur la famille.
  const lignes = familles.map(([nom, o]) => `
    <div class="bk-row pot" data-famille="${nom}" style="cursor:pointer"
         title="Voir les ${o.n} clients · ${nom}">
      <div class="lbl">${nom}</div>
      <div class="b"><i style="width:${Math.round((o.n / nMax) * 100)}%"></i></div>
      <div class="num">${o.n}</div>
    </div>`).join("");

  return `<div class="crm-card">
    <div class="crm-card-head"><h3>Répartition par famille</h3>
      <span class="count">${parFamille.size} familles · cliquer pour voir les clients</span></div>
    <div style="padding:10px 16px 14px">${lignes}</div>
  </div>`;
}

export function vueDashboard(canvas) {
  const cs = motifActif === "tous"
    ? etat.clients
    : etat.clients.filter((c) => c.motif === motifActif);
  const tries = [...cs].sort((a, b) => b.score - a.score);

  const chip = (id, label) => `<button class="chip ${motifActif === id ? "active" : ""}"
    data-motif="${id}">${label}</button>`;

  canvas.innerHTML = `
    <h1 class="crm-h1">Tableau de bord
      <span class="sub">Données du ${dateFr(etat.genereLe)} · ${etat.clients.length} clients au portefeuille</span></h1>
    ${kpis()}
    <div style="display:grid;grid-template-columns:2.3fr 1fr;gap:14px;flex:1;min-height:0">
      <div class="crm-card">
        <div class="crm-card-head">
          <h3>Clients prioritaires</h3>
          <span class="count">${tries.length} résultats · triés par enjeu</span>
          <div class="head-actions">
            <div class="chip-row">
              ${chip("tous", "Tous")}${chip("decrochage", "Décroche")}
              ${chip("dormance", "Dormant")}${chip("crosssell", "À développer")}
            </div>
          </div>
        </div>
        <div style="overflow:auto;min-height:0">
          <table class="crm-table">
            <thead><tr>
              <th>Client</th><th>Canal</th><th>Dern. commande</th>
              <th>CA</th><th>Motif</th><th>Enjeu</th><th></th>
            </tr></thead>
            <tbody>${tries.slice(0, 60).map(ligne).join("")}</tbody>
          </table>
        </div>
      </div>
      ${repartition()}
    </div>`;

  // Chips de filtre par motif.
  canvas.querySelectorAll("[data-motif]").forEach((b) =>
    b.addEventListener("click", () => { motifActif = b.dataset.motif; vueDashboard(canvas); }));

  // Clic sur une ligne (ou bouton Infos client) → ouvre la fiche client.
  canvas.querySelectorAll(".crm-table tbody tr").forEach((tr) =>
    tr.addEventListener("click", () => ouvrirFiche(tr.dataset.compte)));

  // Clic sur une famille (répartition) → vue Clients filtrée sur cette famille.
  canvas.querySelectorAll("[data-famille]").forEach((el) =>
    el.addEventListener("click", () => afficher("clients", { famille: el.dataset.famille })));
}
