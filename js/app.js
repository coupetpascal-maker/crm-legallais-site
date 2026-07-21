// Démarrage : code d'accès → montage du shell → navigation entre vues.
import { charger } from "./donnees.js";
import { monterShell, marquerActif } from "./shell.js";
import { vueDashboard } from "./vue-dashboard.js";
import { vueJour } from "./vue-jour.js";
import { vueSemaine } from "./vue-semaine.js";
import { vueCarte } from "./vue-carte.js";
import { vueClients } from "./vue-clients.js";
import { ouvrirImport } from "./import-modal.js";
import { monterTerrain, vueTournee } from "./vue-terrain.js";

// Table de routage : id de route → fonction de vue (rendue dans le canvas).
const VUES = {
  dashboard: vueDashboard,
  clients: vueClients,
  jour: vueJour,
  semaine: vueSemaine,
  carte: vueCarte,
  terrain: vueTournee, // tournée tactile plein écran (mobile)
};

let canvas = null;
let routeCourante = "dashboard";
let paramsCourants = {};

// Affiche une vue. Exporté car les vues s'appellent entre elles (afficher("clients", …)).
export function afficher(route, params = {}) {
  // « Importer CSV » est un modal, pas une vue : on garde la vue courante.
  if (route === "import") { ouvrirImport(); return; }
  routeCourante = route;
  paramsCourants = params;
  marquerActif(route);
  canvas.innerHTML = "";
  (VUES[route] || VUES.dashboard)(canvas, params);
  canvas.scrollTo?.(0, 0);
}

async function essayer(code) {
  try { await charger(code); return true; } catch { return false; }
}

// Cibles : PC (shell desktop) + iPhone (vue terrain tactile). Bascule au breakpoint.
const ESTmobile = window.matchMedia("(max-width: 700px)");

function monterLayout() {
  if (ESTmobile.matches) {
    // Shell terrain : la bottom nav + les onglets routent dans le canvas (.t-body).
    canvas = monterTerrain((route) => afficher(route));
    afficher("terrain");
  } else {
    canvas = monterShell(
      (route) => afficher(route),
      (q) => afficher("clients", { recherche: q }),
    );
    afficher("dashboard");
  }
}

function ouvrir() {
  document.getElementById("ecran-code").hidden = true;
  document.getElementById("app").hidden = false;
  monterLayout();
  // Re-monte le bon layout quand on franchit le breakpoint (rotation / redimensionnement).
  ESTmobile.addEventListener("change", monterLayout);
  // Un changement de flag « à recontacter » (fiche) rafraîchit la vue courante :
  // la tournée derrière la fiche se met à jour, sans coupler la fiche aux vues.
  document.addEventListener("recontact:change", () => afficher(routeCourante, paramsCourants));
}

async function demarrer() {
  const ecranCode = document.getElementById("ecran-code");

  const codeMemorise = localStorage.getItem("crm_code");
  if (codeMemorise && (await essayer(codeMemorise))) { ouvrir(); return; }

  ecranCode.hidden = false;
  document.getElementById("form-code").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = document.getElementById("champ-code").value;
    if (await essayer(code)) {
      localStorage.setItem("crm_code", code);
      ouvrir();
    } else {
      document.getElementById("erreur-code").hidden = false;
    }
  });
}

demarrer();
