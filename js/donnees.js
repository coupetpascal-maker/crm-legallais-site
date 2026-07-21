// État partagé : données déchiffrées + utilitaires sur le plan.
import { dechiffrer } from "./crypto.js";

export const etat = { clients: [], parCompte: new Map(), plan: null, genereLe: "" };

export async function charger(code) {
  // no-store : toujours la dernière version du fichier (évite un ancien fichier
  // en cache après un import mensuel — desktop comme iPhone).
  const reponse = await fetch("data/clients.enc.json", { cache: "no-store" });
  const paquet = await reponse.json();
  const clair = await dechiffrer(paquet, code);
  etat.clients = clair.clients;
  etat.plan = clair.plan;
  etat.genereLe = clair.genere_le;
  etat.parCompte = new Map(clair.clients.map((c) => [c.compte, c]));
}

// Motif dominant du score → libellé lisible.
export const LIBELLES = {
  decrochage: "Décroche", dormance: "Dormant",
  crosssell: "À développer", entretien: "Entretien",
};
// Niveau d'urgence → couleur du badge (alignée sur le handoff design).
export const COULEURS = { hi: "#d33a2a", mid: "#e08321", lo: "#2f8049" };
// Canal d'action recommandé.
export const CANAUX = { visite: "🚶 Visite", phoning: "📞 Phoning" };

// Date ISO « 2026-07-03 » → « 3 juillet 2026 » (lisible). Renvoie « — » si vide.
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
  "août", "septembre", "octobre", "novembre", "décembre"];
export function dateFr(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return iso || "—";
  return `${Number(m[3])} ${MOIS_FR[Number(m[2]) - 1]} ${m[1]}`;
}

export function aujourdHuiIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function jourDuPlan(dateIso) {
  for (const semaine of etat.plan.semaines)
    for (const jour of semaine)
      if (jour.date === dateIso) return jour;
  return null;
}

export function prochainJour(dateIso) {
  return etat.plan.semaines.flat().find((j) => j.date >= dateIso) || null;
}
