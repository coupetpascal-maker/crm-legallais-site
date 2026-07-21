// Fiche client — side panel droit (slide-in) au-dessus de la vue courante.
// Adapté aux données réelles : pas de série 12 mois ni d'historique de visites
// dans le fichier Unik → on s'appuie sur CA N-2/N-1/N, le motif et le canal.
import { etat, LIBELLES, CANAUX } from "./donnees.js";
import { icone } from "./icons.js";
import { estARecontacter, basculer } from "./recontact.js";

const euros = (n) => Math.round(n).toLocaleString("fr-FR") + " €";
const NIVEAU_LABEL = { hi: "Priorité élevée", mid: "Priorité moyenne", lo: "Priorité faible" };

function initiales(nom) {
  const mots = nom.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/);
  return ((mots[0]?.[0] || "") + (mots[1]?.[0] || mots[0]?.[1] || "")).toUpperCase();
}

// Sparkline SVG (reprise du proto) à partir d'une liste de valeurs.
function sparkline(values, width = 480, height = 48) {
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - ((v - min) / range) * (height - 8) - 4]);
  const line = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = line + ` L${width},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
    <path class="area" d="${area}"/><path class="line" d="${line}"/>
    <circle class="pt" cx="${last[0]}" cy="${last[1]}" r="3.2"/></svg>`;
}

// Une barre de décomposition (label · barre · valeur).
function bkRow(cls, label, valeur, pct) {
  return `<div class="bk-row ${cls}">
    <span class="lbl">${label}</span>
    <span class="b"><i style="width:${pct}%"></i></span>
    <span class="num">${valeur}</span></div>`;
}

function corps(c) {
  const deltaCA = c.ca_n1 > 0 ? Math.round(((c.ca_n - c.ca_n1) / c.ca_n1) * 100) : 0;
  const serie = [c.ca_n2, c.ca_n1, c.ca_n].map((v) => v || 0);
  const maxCA = Math.max(c.ca_n, c.ca_n1, c.ca_n2, 1);
  const noteSauvee = localStorage.getItem("note_" + c.compte) || "";

  return `
    <div class="section-block">
      <div class="label">CA — évolution sur 3 ans</div>
      <div class="tile">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div>
            <div style="font-size:20px;font-weight:600;letter-spacing:-0.02em">${euros(c.ca_n)}</div>
            <div class="faint" style="font-size:11.5px;margin-top:2px">année en cours</div>
          </div>
          <div style="display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:500;color:var(--c-${deltaCA >= 0 ? "lo" : "hi"})">
            ${icone(deltaCA >= 0 ? "trend" : "trendDown", "ico", 'style="width:14px;height:14px;stroke-width:2"')}
            <span>${deltaCA >= 0 ? "+" : ""}${deltaCA}% vs N-1</span>
          </div>
        </div>
        <div style="margin-top:8px">${sparkline(serie)}</div>
        <div style="display:flex;justify-content:space-between;color:var(--c-text-faint);font-size:10.5px;margin-top:2px">
          <span>N-2</span><span>N-1</span><span>N</span>
        </div>
      </div>
    </div>

    <div class="section-block">
      <div class="label">Décomposition — chiffre d'affaires</div>
      <div class="tile" style="padding:4px 14px">
        ${bkRow("pot", "CA année en cours", euros(c.ca_n), Math.round((c.ca_n / maxCA) * 100))}
        ${bkRow("ca", "CA N-1", euros(c.ca_n1), Math.round((c.ca_n1 / maxCA) * 100))}
        ${bkRow("urg", "CA N-2", euros(c.ca_n2), Math.round((c.ca_n2 / maxCA) * 100))}
        <div class="bk-total">
          <span class="muted" style="font-size:12.5px">Enjeu identifié (score)</span>
          <b>${euros(c.score)}</b>
        </div>
      </div>
    </div>

    <div class="section-block">
      <div class="label">Diagnostic</div>
      <div class="tile">
        <div class="timeline">
          <div class="tl-item"><span class="date">Motif</span>
            <div class="body"><div class="head">${LIBELLES[c.motif] || c.motif}
              <span class="pill">${CANAUX[c.canal] || ""}</span></div>
              <div class="desc">Famille : ${c.famille || "—"}</div></div></div>
          <div class="tl-item"><span class="date">Dernière cmde</span>
            <div class="body"><div class="head">${c.date_derniere_cmde || "—"}</div></div></div>
          <div class="tl-item"><span class="date">Marge brute</span>
            <div class="body"><div class="head">${euros(c.vmb)}</div>
              <div class="desc">VMB année en cours · ${c.ca_n > 0 ? Math.round((c.vmb / c.ca_n) * 100) : 0} % du CA</div></div></div>
          <div class="tl-item"><span class="date">Contact</span>
            <div class="body"><div class="head">${c.tel || "—"}</div>
              <div class="desc">${c.mail || "—"}</div></div></div>
        </div>
      </div>
    </div>

    <div class="section-block">
      <div class="label">Suivi</div>
      <label class="suivi-toggle">
        <input type="checkbox" id="recontact-fiche" ${estARecontacter(c.compte) ? "checked" : ""}>
        <span class="suivi-txt">
          <b>À recontacter</b>
          <small>Pas vu / pas eu au téléphone. Réapparaît en tête de la tournée du jour jusqu'à ce que je le décoche.</small>
        </span>
      </label>
    </div>

    <div class="section-block">
      <div class="label">Notes</div>
      <textarea class="note-area" id="note-fiche" placeholder="Notes sur ce client…">${noteSauvee}</textarea>
    </div>`;
}

// Ouvre la fiche d'un client (par numéro de compte).
export function ouvrirFiche(compte) {
  const c = etat.parCompte.get(compte);
  if (!c) return;

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="panel-shroud"></div>
    <aside class="side-panel">
      <div class="side-panel-head">
        <div class="ico-square" style="width:42px;height:42px;border-radius:8px;font-size:14px;flex:0 0 42px;display:grid;place-items:center;background:var(--c-app-bg);border:1px solid var(--c-border);color:var(--c-text-soft);font-weight:600">${initiales(c.nom)}</div>
        <div class="titles">
          <h2>${c.nom}<span class="badge ${c.niveau}"><span class="dot"></span>${NIVEAU_LABEL[c.niveau] || ""}</span><span class="badge recontact" id="badge-recontact" ${estARecontacter(c.compte) ? "" : "hidden"}><span class="dot"></span>À recontacter</span></h2>
          <div class="addr">${icone("pin", "ico", 'style="width:13px;height:13px;stroke-width:1.8"')}<span>${c.adresse || c.ville || "—"}</span></div>
        </div>
        <button class="icon-btn" id="fermer-fiche" title="Fermer">${icone("close", "ico")}</button>
      </div>
      <div class="side-panel-body">${corps(c)}</div>
      <div class="side-panel-foot">
        ${c.tel ? `<a class="btn primary" href="tel:${c.tel.replace(/[^+0-9]/g, "")}">${icone("phone", "ico")}<span>Appeler</span></a>` : ""}
        <a class="btn" target="_blank" href="https://maps.apple.com/?daddr=${encodeURIComponent(c.adresse || c.ville || "")}">${icone("pin", "ico")}<span>Itinéraire</span></a>
        <span class="spacer"></span>
        <button class="btn ghost icon" title="Plus d'actions">${icone("more", "ico")}</button>
      </div>
    </aside>`;

  const app = document.getElementById("app");
  app.appendChild(wrap);

  const fermer = () => {
    localStorage.setItem("note_" + compte, wrap.querySelector("#note-fiche").value);
    wrap.remove();
    document.removeEventListener("keydown", onEsc);
  };
  const onEsc = (e) => { if (e.key === "Escape") fermer(); };

  wrap.querySelector(".panel-shroud").addEventListener("click", fermer);
  wrap.querySelector("#fermer-fiche").addEventListener("click", fermer);
  document.addEventListener("keydown", onEsc);

  const caseRecontact = wrap.querySelector("#recontact-fiche");
  const badgeRecontact = wrap.querySelector("#badge-recontact");
  caseRecontact.addEventListener("change", () => {
    basculer(compte, caseRecontact.checked);        // persiste + émet recontact:change
    badgeRecontact.hidden = !caseRecontact.checked;
  });
}
