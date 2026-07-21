// Modal « Importer des clients » — informatif.
// L'import réel est le pipeline Python mensuel sur le Mac (import.py → chiffre →
// publie) ; le web est en lecture seule. Ce modal reproduit le visuel du handoff
// mais explique la vraie routine au lieu de simuler un import navigateur.
import { etat } from "./donnees.js";
import { icone } from "./icons.js";

export function ouvrirImport() {
  if (document.querySelector(".modal-shroud")) return; // déjà ouvert

  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="modal-shroud">
      <div class="modal">
        <div class="modal-head">
          <div class="ico-square" style="width:36px;height:36px;border-radius:8px;font-size:11px;flex:0 0 36px;display:grid;place-items:center;background:var(--c-accent-tint);border:none;color:var(--c-accent)">
            ${icone("upload", "ico", 'style="width:18px;height:18px;stroke-width:1.8"')}
          </div>
          <div style="flex:1">
            <h2>Importer des clients</h2>
            <div class="sub">La mise à jour se fait une fois par mois, sur le Mac. Voici la marche à suivre.</div>
          </div>
          <button class="icon-btn" id="fermer-import" title="Fermer">${icone("close", "ico")}</button>
        </div>

        <div class="modal-body">
          <div class="dropzone" style="cursor:default">
            <div class="dz-icon">${icone("upload", "ico")}</div>
            <div class="big">Déposer l'export Excel dans <u>import/fichiers/</u></div>
            <div class="small">fichier Legallais (.xlsx) · le pipeline chiffre puis publie</div>
          </div>

          <div class="template-row">
            <div class="ti">${icone("csv", "ico")}</div>
            <div class="meta">
              Puis demander à Claude Code (ou en terminal) :
              <b>« Importe le fichier de &lt;mois&gt; et publie le site »</b>
            </div>
          </div>

          <div class="template-row" style="margin-top:8px">
            <div class="ti">${icone("document", "ico")}</div>
            <div class="meta mono" style="font-size:11.5px">
              venv/bin/python import/import.py import/fichiers/&lt;fichier&gt;.xlsx
            </div>
          </div>

          <div class="recent-imports">
            <div class="lbl">Dernier import</div>
            <div class="recent-row">
              ${icone("csv", "ico", 'style="width:14px;height:14px;stroke:var(--c-text-faint);stroke-width:1.8"')}
              <span class="file">Données en ligne</span>
              <span class="ok">✓ ${etat.clients.length} clients</span>
              <span class="when">généré le ${etat.genereLe || "—"}</span>
            </div>
          </div>
        </div>

        <div class="modal-foot">
          <span class="faint" style="font-size:12px;display:flex;align-items:center;gap:6px">
            ${icone("alert", "ico", 'style="width:14px;height:14px;stroke-width:1.8"')}
            Le code d'accès n'est jamais stocké — perdu = relancer l'import.
          </span>
          <span class="spacer"></span>
          <button class="btn primary" id="ok-import"><span>Compris</span></button>
        </div>
      </div>
    </div>`;

  const app = document.getElementById("app");
  app.appendChild(wrap);

  const fermer = () => { wrap.remove(); document.removeEventListener("keydown", onEsc); };
  const onEsc = (e) => { if (e.key === "Escape") fermer(); };

  // Clic sur le voile (hors modal) ferme.
  wrap.querySelector(".modal-shroud").addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-shroud")) fermer();
  });
  wrap.querySelector("#fermer-import").addEventListener("click", fermer);
  wrap.querySelector("#ok-import").addEventListener("click", fermer);
  document.addEventListener("keydown", onEsc);
}
