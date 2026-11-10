/**
 * Les formes du référentiel géographique (8 novembre 2026). Sans import serveur : le composant
 * client de localisation les importe.
 */

export type Arrondissement = { code: string; nom: string };
export type Departement = { code: string; nom: string; arrondissements: Arrondissement[] };
/** `cle` est la valeur de la question `region_siege` (« Extrême-Nord » → `EXTREME_NORD`). */
export type Region = { code: string; nom: string; cle: string; departements: Departement[] };
export type Decoupage = { regions: Region[]; source: string };

export type Lieu = { nom: string; ville?: string };
export type LieuxDeLArrondissement = {
  arrondissement: string;
  villes: Lieu[];
  localites: Lieu[];
  /** ⚠️ PARTIELS : aucune liste publique complète des quartiers n'existe. */
  quartiers: Lieu[];
};

/**
 * Les réponses que la saisie `LOCALISATION` remplit en plus de la sienne (l'arrondissement).
 * Le formulaire ne les pose donc pas une seconde fois.
 */
export const CHAMPS_DE_LA_LOCALISATION = ["region_siege", "ville_siege", "quartier_siege"] as const;
