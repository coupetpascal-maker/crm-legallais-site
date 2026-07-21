// Carte Leaflet du secteur : un point coloré par client (niveau de priorité).
// Intégrée dans une crm-card ; popup → ouvre la fiche (side panel).
import { etat, COULEURS, jourDuPlan, prochainJour, aujourdHuiIso } from "./donnees.js";
import { ouvrirFiche } from "./fiche-panel.js";

let filtre = "tout"; // "tout" | "jour"

// Secteur de Pascal = départements 83 (Var) + 06 (Alpes-Maritimes). Borne large
// couvrant les deux (littoral → arrière-pays alpin). Tout point hors de cette
// boîte = adresse mal géocodée → ignoré sur la carte (évite un cadrage aberrant).
const SECTEUR = { latMin: 42.9, latMax: 44.5, lonMin: 5.6, lonMax: 7.9 };
const dansSecteur = (c) =>
  c.lat >= SECTEUR.latMin && c.lat <= SECTEUR.latMax &&
  c.lon >= SECTEUR.lonMin && c.lon <= SECTEUR.lonMax;

export function vueCarte(canvas) {
  canvas.innerHTML = `
    <h1 class="crm-h1">Carte du secteur <span class="sub">${etat.clients.length} clients</span></h1>
    <div class="crm-card" style="flex:1;min-height:0">
      <div class="crm-card-head">
        <h3>Répartition géographique</h3>
        <div class="head-actions">
          <div class="chip-row">
            <button class="chip active" data-filtre="tout">Tout le portefeuille</button>
            <button class="chip" data-filtre="jour">Tournée du jour</button>
          </div>
        </div>
      </div>
      <div id="carte"></div>
    </div>`;

  const carte = L.map("carte");
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap", maxZoom: 18,
  }).addTo(carte);
  const calque = L.layerGroup().addTo(carte);

  const dessiner = () => {
    canvas.querySelectorAll("[data-filtre]").forEach(
      (b) => b.classList.toggle("active", b.dataset.filtre === filtre));
    calque.clearLayers();
    // Repli sur la prochaine tournée si rien n'est planifié aujourd'hui (comme la vue terrain).
    const jour = jourDuPlan(aujourdHuiIso()) || prochainJour(aujourdHuiIso());
    const comptesDuJour = new Set(jour ? jour.visites : []);
    const points = [];
    for (const c of etat.clients) {
      if (c.lat == null || !dansSecteur(c)) continue; // hors 83/06 = géocodage douteux
      if (filtre === "jour" && !comptesDuJour.has(c.compte)) continue;
      const couleur = COULEURS[c.niveau];
      L.circleMarker([c.lat, c.lon], {
        radius: 7, color: couleur, fillColor: couleur, fillOpacity: 0.85, weight: 1,
      }).bindPopup(
        `<strong>${c.nom}</strong><br>${c.ville || ""}<br>` +
        `<a href="#" class="lien-fiche" data-compte="${c.compte}">Voir la fiche</a>`
      ).addTo(calque);
      points.push([c.lat, c.lon]);
    }
    if (points.length) carte.fitBounds(points, { padding: [30, 30], maxZoom: 11 });
    else {
      // Aucun point pour ce filtre : on cadre sur tout le portefeuille du secteur,
      // sinon sur la boîte 83/06 (St-Laurent-du-Var → Vidauban).
      const tous = etat.clients.filter((c) => c.lat != null && dansSecteur(c)).map((c) => [c.lat, c.lon]);
      if (tous.length) carte.fitBounds(tous, { padding: [30, 30], maxZoom: 11 });
      else carte.fitBounds([[SECTEUR.latMin, SECTEUR.lonMin], [SECTEUR.latMax, SECTEUR.lonMax]]);
    }
  };

  carte.on("popupopen", (e) => {
    const lien = e.popup.getElement().querySelector(".lien-fiche");
    if (lien) lien.addEventListener("click", (ev) => {
      ev.preventDefault();
      ouvrirFiche(lien.dataset.compte);
    });
  });

  canvas.querySelectorAll("[data-filtre]").forEach((b) =>
    b.addEventListener("click", () => { filtre = b.dataset.filtre; dessiner(); }));

  dessiner();
  setTimeout(() => carte.invalidateSize(), 0);
}
