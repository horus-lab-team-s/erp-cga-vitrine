"use client";

import { startTransition, useActionState, useEffect, useState } from "react";

import {
  lireLesFraisDeLaDemande,
  payerLesFraisDeTraitement,
  type EtatPaiementEnLigne,
} from "@/app/lib/actions-acquisition";

const INITIAL: EtatPaiementEnLigne = { echec: null, fait: null, simule: false };

/**
 * Les frais de traitement de dossier, juste après l'envoi de la demande (9 novembre 2026).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LE CABINET A DÉCIDÉ
 *
 * Pour la plupart des services, un versement accompagne la demande : c'est la garantie
 * que le travail ne se fait pas pour rien, et il est DÉDUIT du total de la procédure. Le
 * montant est fixé par le cabinet, service par service ; le site n'en écrit aucun.
 *
 * ⚠️ CE BOUTON NE PAIE PAS, IL DEMANDE. L'opérateur pousse une demande sur le
 * téléphone ; le versement est constaté par sa notification, et ce bloc relit son état
 * toutes les huit secondes. La demande, elle, est déjà enregistrée : un échec ici ne la
 * fait pas perdre, et le cabinet peut aussi encaisser ces frais au guichet.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function FraisDeTraitement({ jeton, montant }: { jeton: string; montant: string }) {
  const [etat, payer, enCours] = useActionState(payerLesFraisDeTraitement, INITIAL);
  const [verses, setVerses] = useState(false);
  const enAttente = etat.fait !== null && !etat.simule && !verses;

  useEffect(() => {
    if (!enAttente) return;
    const minuterie = setInterval(async () => {
      const lu = await lireLesFraisDeLaDemande(jeton);
      if (lu?.verses) setVerses(true);
    }, 8000);
    return () => clearInterval(minuterie);
  }, [enAttente, jeton]);

  function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const donnees = new FormData(evenement.currentTarget);
    startTransition(() => payer(donnees));
  }

  const francs = `${Number(montant).toLocaleString("fr-FR")} FCFA`;
  return (
    <section className="formulaire-service__pieces" aria-label="Frais de traitement de dossier">
      <h3>Frais de traitement de dossier : {francs}</h3>
      <p>
        Ce versement lance l&rsquo;étude de votre dossier par le cabinet. Il est déduit du montant total de votre
        procédure : vous le retrouverez en moins sur votre proforma.
      </p>
      {verses ? (
        <p role="status" className="suivi__mention">
          Vos frais de traitement sont reçus. Merci : un responsable étudie votre dossier.
        </p>
      ) : (
        <form action={payer} onSubmit={soumettre} className="depot">
          <input type="hidden" name="jeton" value={jeton} />
          <label className="depot__champ">
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
          <button type="submit" className="depot__bouton" disabled={enCours || enAttente}>
            {enCours ? "…" : enAttente ? "Demande envoyée sur votre téléphone" : `Payer ${francs} par mobile money`}
          </button>
        </form>
      )}
      {etat.fait && !verses && (
        <p role="status" className="suivi__mention">
          {etat.fait}
        </p>
      )}
      {etat.echec && (
        <p role="alert" className="depot__echec">
          {etat.echec}
        </p>
      )}
      <p>Vous pouvez aussi les verser au cabinet, en espèces : la caisse les constate.</p>
    </section>
  );
}
