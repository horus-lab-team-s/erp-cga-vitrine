import { appeler, ErreurApi } from "./api";

/**
 * Le suivi d'une prestation ponctuelle, par le lien reçu (19 octobre 2026, point 22).
 *
 * ⚠️ Le serveur rend le même refus pour un lien faux et pour une mission inconnue :
 * la page n'en dit pas plus, comme le suivi d'une création.
 */
export type SuiviDeMaMission = {
  objet: string;
  prestation: string;
  etat: "OUVERTE" | "A_VALIDER" | "LIVREE";
  ouverte_le: string;
  livree_le: string | null;
  livrable: boolean;
};

export const ETAPES_DE_MISSION = [
  { code: "OUVERTE", nom: "Prise en charge" },
  { code: "A_VALIDER", nom: "Relecture" },
  { code: "LIVREE", nom: "Livrée" },
] as const;

export async function lireMaMission(
  identifiant: string,
  sceau: string,
): Promise<SuiviDeMaMission | { echec: string }> {
  const p = new URLSearchParams({ s: sceau });
  try {
    return await appeler<SuiviDeMaMission>(`/missions/${encodeURIComponent(identifiant)}/suivi?${p}`);
  } catch (erreur) {
    if (erreur instanceof ErreurApi) return { echec: erreur.message };
    throw erreur;
  }
}
