/**
 * Le suivi d'une création : types et bornes partagés.
 *
 * ⚠️ Ces déclarations vivent hors de `actions-creation-suivi.ts` parce que Next
 * exige que **tout** export d'un module « use server » soit une fonction
 * asynchrone. Un type ou une constante exportés de là-bas font échouer la
 * construction avec un message qui ne dit pas lequel est fautif — « Failed to
 * collect page data », et un numéro de ligne qui désigne la fin du fichier.
 *
 * Le dépôt portait déjà cet avertissement en tête de `acquisition.ts`. Je l'ai
 * quand même rencontré : la constante `DEPOT_INITIAL` y était.
 */

export type PieceAttendue = {
  code: string;
  libelle: string;
  obligatoire: boolean;
  fournie: boolean;
  fournie_le: string | null;
};

export type SuiviDeMaCreation = {
  reference: string;
  denomination_souhaitee: string;
  forme_juridique: string;
  etape: string;
  ouvert_le: string;
  clos: boolean;
  pieces: PieceAttendue[];
  manquantes_bloquantes: number;
  /**
   * ⚠️ **LES NUMÉROS DE SA PROPRE SOCIÉTÉ.**
   *
   * Ils manquaient, et c'était le plus gros manque de cette page : la cliente
   * suivait son dossier jusqu'à « votre immatriculation est en cours » sans
   * jamais lire la nouvelle qu'elle attend depuis le premier jour. Sa banque
   * et ses fournisseurs lui demanderont ces numéros.
   */
  identifiants: IdentifiantsDeMaSociete;
};

export type IdentifiantsDeMaSociete = {
  rccm: string | null;
  rccm_obtenu_le: string | null;
  niu: string | null;
  niu_obtenu_le: string | null;
  patente: string | null;
  patente_obtenue_le: string | null;
  cnps: string | null;
  cnps_obtenu_le: string | null;
  /** RCCM et NIU obtenus : la société existe. Calculé par le serveur. */
  immatriculee: boolean;
};

export type EtatDepot = { echec: string | null; fait: string | null };

export const DEPOT_INITIAL: EtatDepot = { echec: null, fait: null };
