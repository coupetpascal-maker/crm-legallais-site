// Les 4 semaines du mois, 4 jours par semaine (lundi → jeudi).
import { etat, aujourdHuiIso } from "./donnees.js";
import { afficher } from "./app.js";

const JOURS_FR = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];

export function vueSemaine(conteneur, params = {}) {
  const auj = aujourdHuiIso();
  let active = params.semaine;
  if (active === undefined) {
    active = etat.plan.semaines.findIndex((s) => s.some((j) => j.date >= auj));
    if (active < 0) active = etat.plan.semaines.length - 1;
  }

  let html = `<h1>Mon plan du mois</h1><div class="pastilles">`;
  etat.plan.semaines.forEach((_, i) => {
    html += `<button data-semaine="${i}" class="${i === active ? "actif" : ""}">S${i + 1}</button>`;
  });
  html += `</div>`;

  etat.plan.semaines[active].forEach((jour) => {
    const d = new Date(jour.date + "T12:00:00");
    const estAujourdhui = jour.date === auj;
    html += `
      <div class="carte-jour" data-date="${jour.date}" style="${estAujourdhui ? "border-color:#2553a8;" : ""}">
        <div class="infos">
          <strong>${JOURS_FR[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}${estAujourdhui ? " · aujourd'hui" : ""}</strong>
          <span class="sous">${jour.zone} · ${jour.visites.length} visites</span>
        </div>
        <span class="action">›</span>
      </div>`;
  });
  conteneur.innerHTML = html;

  conteneur.querySelectorAll(".pastilles button").forEach((b) =>
    b.addEventListener("click", () =>
      afficher("semaine", { semaine: Number(b.dataset.semaine) })));
  conteneur.querySelectorAll(".carte-jour").forEach((carte) =>
    carte.addEventListener("click", () => afficher("jour", { date: carte.dataset.date })));
}
