"use server";

import { revalidatePath } from "next/cache";

import { ErreurApi, appeler } from "@/app/lib/api";
import type { EtatDepot, SuiviDeMaCreation } from "@/app/lib/creation-suivi";

/**
 * Le suivi de formalité, tel que la fondatrice le lit, et le dépôt de ses pièces.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Entre son règlement et son immatriculation, la cliente n'avait rien : ni
 * dépôt de pièce, ni avancement. Les routes de la formalité exigent toutes une
 * habilitation de collaborateur.
 *
 * Le canal prévu était la messagerie instantanée. Le cabinet a constaté qu'elle
 * ne tient pas : on ne peut écrire librement qu'à l'intérieur de la fenêtre de
 * vingt-quatre heures ouverte par le dernier message du client, et une formalité
 * dure des semaines.
 *
 * ⚠️ **AUCUN COMPTE, ET C'EST LA DÉCISION DU 27 SEPTEMBRE QUI TIENT.** Un
 * formulaire à identifiants pour envoyer la photo d'une carte d'identité ferait
 * abandonner la moitié des dossiers. Le sceau du lien tient lieu de preuve ; le
 * compte à mot de passe arrive avec la société, au NIU.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Lit le dossier derrière le lien. Un lien qui ne vaut pas ne montre rien. */
export async function lireMonDossier(
  reference: string,
  sceau: string,
): Promise<SuiviDeMaCreation | { echec: string }> {
  const p = new URLSearchParams({ s: sceau });
  try {
    return await appeler<SuiviDeMaCreation>(
      `/creations/${encodeURIComponent(reference)}/suivi?${p}`,
    );
  } catch (erreur) {
    if (erreur instanceof ErreurApi) return { echec: erreur.message };
    throw erreur;
  }
}

/**
 * Envoie le document, puis le rattache à la pièce attendue.
 *
 * ⚠️ **DEUX APPELS, ET L'ORDRE COMPTE.** Le fichier part d'abord et rend son
 * empreinte ; on ne peut pas désigner une pièce qui n'existe pas encore. C'est
 * exactement ce que fait la console pour les pièces du cabinet.
 *
 * ⚠️ **LE TYPE N'EST PAS VÉRIFIÉ ICI.** Le serveur le détermine en lisant les
 * premiers octets, jamais l'extension ni ce que le navigateur déclare. Le
 * contrôler ici en plus ferait croire qu'il est contrôlé ici.
 */
export async function deposerMaPiece(
  _precedent: EtatDepot,
  donnees: FormData,
): Promise<EtatDepot> {
  const reference = String(donnees.get("reference") ?? "").trim();
  const sceau = String(donnees.get("sceau") ?? "").trim();
  const code = String(donnees.get("code") ?? "").trim();
  const fichier = donnees.get("fichier");
  if (!reference || !sceau || !code) {
    return { echec: "Lien incomplet. Rouvrez-le depuis votre courriel.", fait: null };
  }
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { echec: "Choisissez un document à envoyer.", fait: null };
  }

  const envoi = new FormData();
  envoi.append("fichier", fichier);
  const p = new URLSearchParams({ reference, s: sceau });
  try {
    const depose = await appeler<{ empreinte: string }>(
      `/collecte/fichiers-scelles?${p}`,
      { methode: "POST", formulaire: envoi },
    );
    await appeler(`/creations/${encodeURIComponent(reference)}/suivi/pieces?${p}`, {
      methode: "POST",
      corps: { code, empreinte: depose.empreinte },
    });
    // ⚠️ SANS CECI, ELLE NE VOIT PAS SON DOSSIER AVANCER.
    //
    // La ligne disait bien « document reçu », mais le compte en tête de page —
    // « il nous manque 8 documents » — restait à huit, et la pièce ne passait pas
    // dans « déjà reçus ». Constaté en déposant réellement depuis un navigateur.
    //
    // Une cliente qui envoie neuf pièces a besoin de voir le compte descendre :
    // c'est la seule chose qui lui dit qu'elle approche du but, et sans elle
    // elle renverra deux fois le même document par précaution.
    revalidatePath("/[locale]/mon-dossier/[reference]", "page");
    return { echec: null, fait: "Document reçu. Le cabinet le verra dans votre dossier." };
  } catch (erreur) {
    if (erreur instanceof ErreurApi) return { echec: erreur.message, fait: null };
    throw erreur;
  }
}
