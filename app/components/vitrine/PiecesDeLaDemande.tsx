"use client";

import { useActionState } from "react";

import { joindreUnePieceALaDemande, type EtatDesPiecesJointes } from "@/app/lib/actions-acquisition";

const INITIAL: EtatDesPiecesJointes = { echec: null, recues: [] };

/**
 * Joindre des documents à la demande qu'on vient d'envoyer (19 octobre 2026, point 22).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ APRÈS L'ENVOI, ET NON DANS LE FORMULAIRE.
 *
 * Le visiteur joignait son bail ou ses statuts par WhatsApp, à part : le cabinet
 * recevait une demande muette, puis un fichier sans demande. Le bloc paraît une fois
 * la demande enregistrée, avec le jeton qu'elle a rendu : un échec d'envoi de pièce
 * ne peut donc plus faire perdre la demande elle-même. Tout est facultatif.
 *
 * Même parti que `DepotDePiece` : un vrai formulaire, sans `capture`, et aucun
 * contrôle de type ni de taille ici, le serveur les fait.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function PiecesDeLaDemande({ jeton }: { jeton: string }) {
  // ⚠️ La liste de ce qui est parti vit dans l'état de l'action : le formulaire se
  // vide de lui-même après un envoi réussi, et le visiteur voit ce qu'il a déjà joint.
  const [etat, joindre, enCours] = useActionState(joindreUnePieceALaDemande, INITIAL);

  return (
    <section className="formulaire-service__pieces" aria-label="Joindre des documents">
      <h3>Joindre un document, si vous le souhaitez</h3>
      <p>
        Un bail, des statuts, une facture : le cabinet le lira avant de vous rappeler. PDF ou
        photo, 10 Mo au plus, cinq documents au maximum.
      </p>
      <form action={joindre} className="depot">
        <input type="hidden" name="jeton" value={jeton} />
        <label className="depot__champ">
          <span className="depot__invisible">Document à joindre</span>
          <input type="file" name="fichier" required accept="image/jpeg,image/png,application/pdf" />
        </label>
        <button type="submit" className="depot__bouton" disabled={enCours}>
          {enCours ? "Envoi…" : "Joindre"}
        </button>
      </form>
      {etat.recues.map((texte) => (
        <p key={texte} role="status" className="suivi__mention">
          {texte}
        </p>
      ))}
      {etat.echec && (
        <p role="alert" className="depot__echec">
          {etat.echec}
        </p>
      )}
    </section>
  );
}
