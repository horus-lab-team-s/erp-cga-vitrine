"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect } from "react";

import { payerEnLigne, type EtatPaiementEnLigne } from "@/app/lib/actions-acquisition";

const INITIAL: EtatPaiementEnLigne = { echec: null, fait: null, simule: false };

/**
 * Le règlement par mobile money, depuis la page de la proposition acceptée.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LE CABINET A DEMANDÉ, LE 14 OCTOBRE 2026
 *
 * « Un lien de paiement Tara Money, avec auto-validation si le paiement est
 * effectif. » La cliente acceptait, lisait « le cabinet revient vers vous pour le
 * règlement », et attendait un appel.
 *
 * ⚠️ CE BOUTON NE PAIE PAS, IL DEMANDE.
 *
 * L'opérateur pousse une demande sur le téléphone ; c'est en y saisissant son
 * code que la cliente paie. La page le dit, et ne promet rien d'autre. Ce qui
 * constate le règlement est la notification de l'opérateur, côté serveur.
 *
 * ⚠️ LA PAGE SE RELIT TOUTE SEULE.
 *
 * Une fois la demande partie, elle interroge son propre état toutes les huit
 * secondes. Dès que le serveur a constaté le règlement, elle passe à « réglé »
 * sans que la cliente ait rien à recharger : c'est l'auto-validation, vue d'elle.
 *
 * ⚠️ SANS IDENTIFIANTS MARCHANDS, ELLE LE DIT. La plateforme tourne alors en mode
 * simulé et n'envoie aucune demande réelle. Laisser la cliente fixer son
 * téléphone en attendant un menu qui ne viendra pas serait la pire des réponses.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function PaiementEnLigne({
  numero,
  version,
  expireLe,
  sceau,
  montant,
}: {
  numero: string;
  version: string;
  expireLe: string;
  sceau: string;
  montant: string;
}) {
  const [etat, payer, enCours] = useActionState(payerEnLigne, INITIAL);
  const routeur = useRouter();
  const enAttente = etat.fait !== null && !etat.simule;

  useEffect(() => {
    if (!enAttente) return;
    const minuterie = setInterval(() => routeur.refresh(), 8000);
    return () => clearInterval(minuterie);
  }, [enAttente, routeur]);

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const donnees = new FormData(evenement.currentTarget);
    startTransition(() => payer(donnees));
  }

  return (
    <form action={payer} onSubmit={soumettre} className="proforma__formulaire" id="paiement">
      <input type="hidden" name="numero" value={numero} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="expire_le" value={expireLe} />
      <input type="hidden" name="sceau" value={sceau} />
      <label className="proforma__champ">
        Numéro mobile money à débiter
        <input
          name="telephone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          placeholder="Laissez vide pour le numéro de votre demande"
        />
      </label>
      <button type="submit" className="bouton bouton--principal proforma__valider" disabled={enCours || enAttente}>
        {enCours ? "…" : enAttente ? "Demande envoyée sur votre téléphone" : `Payer ${montant} par mobile money`}
      </button>
      {etat.fait && (
        <p role="status" className={`proforma__etat ${etat.simule ? "" : "proforma__etat--succes"}`}>
          {etat.fait}
        </p>
      )}
      {etat.echec && (
        <p role="alert" className="proforma__etat proforma__etat--erreur">
          {etat.echec}
        </p>
      )}
    </form>
  );
}
