// Tournée du jour : 6 clients dans l'ordre de passage.
import { etat, jourDuPlan, prochainJour, aujourdHuiIso, LIBELLES } from "./donnees.js";
import { afficher } from "./app.js";
import { ouvrirFiche } from "./fiche-panel.js";
import { recontactPourJour } from "./recontact.js";

const JOURS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// Bloc « À recontacter » (clients cochés) rendu en tête, y compris un jour
// sans tournée planifiée (sinon un client réinjecté resterait invisible).
function blocRecontactJour(clients) {
  if (!clients.length) return "";
  const lignes = clients.map((c) => `
    <li class="carte-visite recontact" data-compte="${c.compte}">
      <span class="rang mid">!</span>
      <div class="infos"><strong>${c.nom}</strong>
        <span class="sous">${c.ville || ""} · ${LIBELLES[c.motif] || ""}</span></div>
      <a class="action" href="tel:${(c.tel || "").replace(/[^+0-9]/g, "")}" aria-label="Appeler">📞</a>
      <a class="action" target="_blank" href="https://maps.apple.com/?daddr=${encodeURIComponent(c.adresse || c.ville || "")}" aria-label="Itinéraire">🧭</a>
    </li>`).join("");
  return `<div class="jour-recontact-head">À recontacter (${clients.length})</div>
    <ol class="visites recontact-list">${lignes}</ol>`;
}

function lienPlan(client) {
  return "https://maps.apple.com/?daddr=" + encodeURIComponent(client.adresse);
}

function lienItineraireComplet(jour) {
  const etapes = jour.visites.map(
    (compte) => encodeURIComponent(etat.parCompte.get(compte).adresse));
  return "https://www.google.com/maps/dir/" + etapes.join("/");
}

export function vueJour(conteneur, params = {}) {
  const dateIso = params.date || aujourdHuiIso();
  const jour = jourDuPlan(dateIso);

  const recontactClients = recontactPourJour(etat.parCompte, etat.plan, jour);
  const blocSet = new Set(recontactClients.map((c) => c.compte));
  const blocRecontact = blocRecontactJour(recontactClients);

  if (!jour) {
    const prochain = prochainJour(dateIso);
    conteneur.innerHTML = blocRecontact + `
      <div class="message-central">
        <h1>Pas de tournée aujourd'hui</h1>
        <p>Journée administrative ou hors plan.</p>
      </div>`;
    if (prochain) {
      const bouton = document.createElement("button");
      bouton.className = "bouton-large";
      bouton.textContent = `Voir la prochaine tournée (${prochain.date.slice(8)}/${prochain.date.slice(5, 7)})`;
      bouton.addEventListener("click", () => afficher("jour", { date: prochain.date }));
      conteneur.appendChild(bouton);
    }
    return;
  }

  const d = new Date(dateIso + "T12:00:00");
  let html = blocRecontact + `<h1>${JOURS_FR[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} — ${jour.zone}</h1>
    <ol class="visites">`;
  jour.visites.filter((compte) => !blocSet.has(compte)).forEach((compte, i) => {
    const c = etat.parCompte.get(compte);
    html += `
      <li class="carte-visite" data-compte="${c.compte}">
        <span class="rang ${c.niveau}">${i + 1}</span>
        <div class="infos">
          <strong>${c.nom}</strong>
          <span class="sous">${c.ville || ""} · ${LIBELLES[c.motif]}</span>
        </div>
        <a class="action" href="tel:${(c.tel || "").replace(/[^+0-9]/g, "")}" aria-label="Appeler">📞</a>
        <a class="action" href="${lienPlan(c)}" target="_blank" aria-label="Itinéraire">🧭</a>
      </li>`;
  });
  html += `</ol>
    <a class="bouton-large" target="_blank" href="${lienItineraireComplet(jour)}">Itinéraire complet</a>`;
  conteneur.innerHTML = html;

  conteneur.querySelectorAll(".carte-visite .infos").forEach((zone) =>
    zone.addEventListener("click", () =>
      ouvrirFiche(zone.parentElement.dataset.compte)));
}
