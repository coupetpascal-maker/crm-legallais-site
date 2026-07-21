// État « à recontacter » — flag client-side (localStorage) réinjecté dans la
// tournée du jour. Concern séparé des données déchiffrées (donnees.js).
// Clé : recontact_<compte> (calquée sur note_<compte> → survit aux ré-imports).
const PREFIX = "recontact_";

export function estARecontacter(compte) {
  return localStorage.getItem(PREFIX + compte) === "1";
}

// Coche/décoche puis prévient l'app (elle re-render la vue courante).
export function basculer(compte, actif) {
  if (actif) localStorage.setItem(PREFIX + compte, "1");
  else localStorage.removeItem(PREFIX + compte);
  document.dispatchEvent(new CustomEvent("recontact:change", { detail: { compte } }));
}

// Comptes cochés encore présents dans les données (parCompte = etat.parCompte).
// Un flag orphelin (client disparu d'un import) est ignoré, sans erreur.
export function comptesARecontacter(parCompte) {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const cle = localStorage.key(i);
    if (cle && cle.startsWith(PREFIX)) {
      const compte = cle.slice(PREFIX.length);
      if (parCompte.has(compte)) out.push(compte);
    }
  }
  return out;
}

// Clients cochés à afficher dans la tournée d'un jour donné (jour = {zone} ou null).
// Règle : si la ville du client est une zone du plan du mois → il ne réapparaît que
// les jours de sa zone (son secteur) ; sinon (ville jamais présente comme zone) →
// il reste visible tous les jours (filet anti-oubli). Le plan reste inchangé.
export function recontactPourJour(parCompte, plan, jour) {
  const zonesDuPlan = new Set(plan.semaines.flat().map((j) => j.zone));
  const zoneJour = jour ? jour.zone : null;
  return comptesARecontacter(parCompte)
    .map((cp) => parCompte.get(cp))
    .filter(Boolean)
    .filter((c) => (c.ville && zonesDuPlan.has(c.ville)) ? c.ville === zoneJour : true);
}
