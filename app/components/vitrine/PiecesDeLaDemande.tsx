"use client";

import { useActionState } from "react";

import type { Demarche } from "@/app/lib/acquisition";
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
/**
 * Ce que le visiteur peut déjà avoir en main, selon sa démarche (9 novembre 2026).
 *
 * ⚠️ À LA CRÉATION, L'ENTREPRISE N'EXISTE PAS ENCORE. On ne lui demande donc ni bail (il se
 * signe au nom de la société une fois créée), ni facture. Les statuts restent FACULTATIFS
 * (réunion du 4 novembre 2026, demande 2) : un fondateur qui en a déjà, ou un projet, les
 * joint ; sinon le cabinet les rédige. Seulement ce qu'un fondateur possède déjà : les libellés reprennent ceux de la
 * liste des pièces de création du cabinet (`creation_entreprise/domaine/checklist.py`).
 */
const PIECES_SUGGEREES: Partial<Record<Demarche, { texte: string; liste?: string[] }>> = {
  CREATION: {
    texte:
      "Votre entreprise n'existe pas encore : joignez seulement ce que vous avez déjà, le cabinet vous dira ensuite ce qui manque. Pas de bail : il se signe au nom de la société, une fois celle-ci créée.",
    liste: [
      "Vos statuts, ou votre projet de statuts, si vous en avez déjà : sinon, le cabinet les rédige",
      "La pièce d'identité du fondateur (CNI, ou passeport pour un promoteur étranger), et celles des associés",
      "L'extrait de casier judiciaire, s'il date de moins de trois mois",
      "Le plan de localisation du futur siège, si vous l'avez",
      "Pour une profession réglementée : l'attestation de votre ordre professionnel",
      "Pour un promoteur étranger : l'autorisation d'exercer l'activité, si vous l'avez",
      "Si vous agissez pour le compte d'un tiers : sa procuration signée",
    ],
  },
};

const TEXTE_GENERAL =
  "Un bail, des statuts, une facture : le cabinet le lira avant de vous rappeler.";

export function PiecesDeLaDemande({ jeton, demarche }: { jeton: string; demarche?: Demarche }) {
  const suggerees = demarche ? PIECES_SUGGEREES[demarche] : undefined;
  // ⚠️ La liste de ce qui est parti vit dans l'état de l'action : le formulaire se
  // vide de lui-même après un envoi réussi, et le visiteur voit ce qu'il a déjà joint.
  const [etat, joindre, enCours] = useActionState(joindreUnePieceALaDemande, INITIAL);

  return (
    <section className="formulaire-service__pieces" aria-label="Joindre des documents">
      <h3>Joindre un document, si vous le souhaitez</h3>
      <p>
        {suggerees?.texte ?? TEXTE_GENERAL} PDF ou photo, 10 Mo au plus, cinq documents au maximum.
      </p>
      {suggerees?.liste && (
        <ul>
          {suggerees.liste.map((piece) => (
            <li key={piece}>{piece}</li>
          ))}
        </ul>
      )}
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
