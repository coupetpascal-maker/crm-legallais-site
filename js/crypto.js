// Déchiffrement AES-GCM — miroir exact de import/crm/chiffrement.py.
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function dechiffrer(paquet, code) {
  const materiel = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]);
  const cle = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64(paquet.kdf.sel),
      iterations: paquet.kdf.iterations, hash: "SHA-256" },
    materiel, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const clair = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64(paquet.chiffre.iv) }, cle, b64(paquet.donnees));
  return JSON.parse(new TextDecoder().decode(clair));
}
