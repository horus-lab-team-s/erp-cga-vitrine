"use client";

import { useActionState } from "react";

import { accepterLaProforma } from "@/app/lib/actions-acquisition";
import { ETAT_ACTE_INITIAL } from "@/app/lib/saisie";

/**
 * Le geste d'accord du client (pas 67).
 *
 * ⚠️ **Il vaut engagement.** D'où deux exigences avant l'envoi : que le client écrive
 * qui il est et à quel titre, et qu'il coche une case qui dit ce qu'il fait. Le backend
 * fige ensuite le montant, la date, la version du document et l'origine de la requête.
 */
export function AcceptationProforma({
  numero,
  version,
  expireLe,
  sceau,
}: {
  numero: string;
  version: string;
  expireLe: string;
  sceau: string;
}) {
  const [etat, accepter, enCours] = useActionState(accepterLaProforma, ETAT_ACTE_INITIAL);
  if (etat.fait) {
    return (
      <p role="status" className="proforma__etat proforma__etat--succes">
        {etat.fait}
      </p>
    );
  }
  return (
    <form action={accepter} className="proforma__formulaire">
      <input type="hidden" name="numero" value={numero} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="expire_le" value={expireLe} />
      <input type="hidden" name="sceau" value={sceau} />
      <label className="proforma__champ">
        Votre nom et votre qualité
        <input
          name="identite_declaree"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          placeholder="Ex. : Jean Mbida, gérant"
        />
      </label>
      <label className="proforma__case">
        <input type="checkbox" name="engagement" value="oui" required />
        <span>J&rsquo;accepte cette proposition au montant indiqué ; mon accord engage l&rsquo;entreprise que je représente.</span>
      </label>
      {/* ⚠️ `bouton--principal`, la classe qui existe. `bouton--primaire`, écrite ici au
          premier jet, n'est définie nulle part : le geste qui engage le client
          s'affichait en texte nu, sans fond ni bord. */}
      <button type="submit" className="bouton bouton--principal proforma__valider" disabled={enCours}>
        {enCours ? "Enregistrement…" : "J’accepte la proposition"}
      </button>
      {etat.echec && (
        <p role="alert" className="proforma__etat proforma__etat--erreur">
          {etat.echec}
        </p>
      )}
    </form>
  );
}
