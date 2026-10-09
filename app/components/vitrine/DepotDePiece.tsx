"use client";

import { useActionState } from "react";

import { deposerMaPiece } from "@/app/lib/actions-creation-suivi";
import { DEPOT_INITIAL } from "@/app/lib/creation-suivi";

/**
 * Le bouton par lequel la fondatrice envoie un document, depuis son téléphone.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ `capture` N'EST PAS POSÉ, ET C'EST RÉFLÉCHI.
 *
 * L'attribut forcerait l'appareil photo. Or la moitié de ces documents sont déjà
 * dans le téléphone : une photo prise la veille, un fichier reçu par messagerie,
 * un scan envoyé par le notaire. Forcer la prise de vue les obligerait à
 * photographier un écran.
 *
 * `accept` propose les bons formats sans les imposer : le serveur détermine le
 * type en lisant les premiers octets, jamais l'extension ni ce que le navigateur
 * déclare.
 *
 * ⚠️ AUCUNE VÉRIFICATION DE TYPE NI DE TAILLE ICI. Le serveur les fait, et les
 * refaire ici ferait croire qu'elles sont faites ici : le jour où l'une des deux
 * changerait, l'écran mentirait.
 *
 * ⚠️ L'ENVOI SE FAIT PAR UN FORMULAIRE, ET NON PAR UN APPEL DE SCRIPT. La page
 * reste utilisable là où le script ne s'exécute pas ou met trop longtemps à
 * arriver, ce qui est le cas courant sur un réseau mobile de bord de route.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function DepotDePiece({
  reference,
  sceau,
  code,
  libelle,
}: {
  reference: string;
  sceau: string;
  code: string;
  libelle: string;
}) {
  const [etat, deposer, enCours] = useActionState(deposerMaPiece, DEPOT_INITIAL);

  if (etat.fait) {
    return (
      <span role="status" className="suivi__mention">
        {etat.fait}
      </span>
    );
  }

  return (
    <form action={deposer} className="depot">
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="sceau" value={sceau} />
      <input type="hidden" name="code" value={code} />
      <label className="depot__champ">
        {/* ⚠️ Le libellé de la pièce est répété pour les lecteurs d'écran : sur
            une liste de neuf lignes, « Choisir un fichier » seul ne dit pas
            laquelle. */}
        <span className="depot__invisible">Envoyer : {libelle}</span>
        <input
          type="file"
          name="fichier"
          required
          accept="image/jpeg,image/png,image/tiff,application/pdf"
        />
      </label>
      <button type="submit" className="depot__bouton" disabled={enCours}>
        {enCours ? "Envoi…" : "Envoyer"}
      </button>
      {etat.echec && (
        <span role="alert" className="depot__echec">
          {etat.echec}
        </span>
      )}
    </form>
  );
}
