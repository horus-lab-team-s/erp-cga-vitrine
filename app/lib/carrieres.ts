import { appeler } from "./api";

/**
 * Les offres de poste du cabinet, telles que le backend les publie (16 octobre 2026). Les
 * qualifications arrivent déjà découpées en blocs : le site les rend en JSX, sans HTML.
 */

export type Segment = { texte: string; gras: boolean; italique: boolean };
export type BlocDeTexte =
  | { type: "intertitre"; texte: string }
  | { type: "paragraphe"; segments: Segment[] }
  | { type: "liste"; points: Segment[][] };

export type TypeDeContrat = "CDI" | "CDD" | "STAGE" | "PRESTATION";

export type OffreDePoste = {
  identifiant: string;
  intitule: string;
  lieu: string;
  type_de_contrat: TypeDeContrat;
  date_limite: string | null;
  description: BlocDeTexte[];
  qualifications: BlocDeTexte[];
};

export function lireLesOffres(): Promise<OffreDePoste[]> {
  return appeler<OffreDePoste[]>("/vitrine/offres");
}

/** Une offre ouverte, ou `null` si elle n'existe pas, n'est pas publiée ou est échue. */
export async function lireUneOffre(identifiant: string): Promise<OffreDePoste | null> {
  try {
    return await appeler<OffreDePoste>(`/vitrine/offres/${encodeURIComponent(identifiant)}`);
  } catch {
    return null;
  }
}
