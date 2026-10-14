/**
 * La demande de contact déposée depuis la vitrine : types et bornes partagés.
 *
 * ⚠️ Ces déclarations vivent hors de `actions-acquisition.ts` parce que Next exige
 * que **tout** export d'un module « use server » soit une fonction asynchrone. Un
 * type ou une constante exportés de là-bas feraient échouer la construction avec un
 * message qui ne dit pas lequel est fautif.
 */

/**
 * Les démarches proposées par le formulaire, dans l'ordre d'affichage.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE SONT LES CODES DU CATALOGUE, ET C'EST UNE CORRECTION DU 27 SEPTEMBRE.
 *
 * Cette liste portait `creation`, `adhesion`, `ponctuel`… en minuscules. Le
 * catalogue du serveur publie `CREATION`, `ADHESION`, `PONCTUEL`, et le
 * référentiel de qualification était indexé sur une troisième forme encore.
 *
 * Conséquence, vérifiée en jouant le parcours : **aucune demande déposée depuis
 * ce formulaire ne pouvait être qualifiée**, donc ni chiffrée, ni transformée en
 * proforma. Le tunnel commercial était sans issue pour tout le trafic public, et
 * rien ne le signalait — le jeu de démonstration et les cas du serveur déposent
 * directement la clé interne, sans jamais traverser cette frontière-ci.
 *
 * Le cabinet a tranché : le catalogue fait foi. Un code ajouté ici doit exister
 * là-bas, et porter un questionnaire au référentiel.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const DEMARCHES = [
  "CREATION",
  "ADHESION",
  // Entrée au catalogue le 30 septembre 2026, avec son questionnaire et son
  // barème. Voir `tests/test_paie_au_catalogue.py` au dépôt du serveur.
  "PAIE",
  "PONCTUEL",
  "DOMICILIATION",
  "FORMATION",
] as const;

/*
 * ⚠️ **`AUTRE` A ÉTÉ RETIRÉ, ET IL FAUT SAVOIR POURQUOI.**
 *
 * Il n'existait dans aucun catalogue : c'était un sixième choix offert au
 * visiteur, sans code, donc sans questionnaire, donc sans chiffrage possible.
 * Un dossier déposé sous « Autre demande » ne pouvait **jamais** devenir une
 * proforma. Il ne se voyait pas : il ressemblait à un dossier qui attend.
 *
 * Ce n'est pas une perte pour le visiteur. `PONCTUEL` est le fourre-tout du
 * catalogue, et son résumé le dit : « une mission délimitée, chiffrée après
 * examen ». Le champ de message reste là pour qu'il explique son besoin.
 *
 * ⚠️ Le serveur refuse désormais tout code inconnu du catalogue, au dépôt.
 * Cette liste et la sienne ne peuvent donc plus diverger en silence : la
 * divergence se voit à la première demande déposée.
 */

export type Demarche = (typeof DEMARCHES)[number];

/**
 * La clé de traduction d'une démarche, composée en un seul endroit.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI CETTE FONCTION EXISTE PLUTÔT QU'UN `.toLowerCase()` SUR PLACE
 *
 * Les codes du catalogue sont en majuscules — `CREATION` — et les clés du
 * fichier de traduction en minuscules — `creation`. Quatre endroits composaient
 * la clé à la main. Trois minusculaient, **un l'avait oublié** :
 *
 *     MISSING_MESSAGE: vitrine.formulaire.demarches.CREATION (fr)
 *
 * Relevé le 29 septembre par le parcours navigateur, qui refuse toute erreur de
 * console sur une page publique. Ce qu'un visiteur en voyait : le message
 * WhatsApp préparé pour le cabinet portait « Démarche : demarches.CREATION » au
 * lieu du libellé, sur le formulaire de démarche de la page d'accueil.
 *
 * ⚠️ **NE COMPOSEZ PLUS LA CLÉ À LA MAIN.** Une fonction se trouve à
 * l'autocomplétion, une convention se perd — et celle-ci s'était déjà perdue une
 * fois sur quatre.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function cleDeLaDemarche(code: string): string {
  return `demarches.${code.toLowerCase()}`;
}

/** Ce que le formulaire transmet à l'action serveur. */
export type DemandeSoumise = {
  demarche: Demarche;
  nom: string;
  telephone: string;
  courriel: string;
  message: string;
  /**
   * La case « J'accepte que le cabinet utilise ces informations pour me
   * recontacter ». Ce n'est **pas** un consentement WhatsApp : voir l'action.
   */
  consentementContact: boolean;
  /**
   * La SECONDE case, facultative : « m'écrire sur WhatsApp à ce numéro ».
   *
   * ⚠️ Elle est distincte de la première, et ce n'est pas de la prudence de
   * principe. Consentir à être recontacté n'est pas consentir à recevoir des
   * messages WhatsApp : ce sont deux textes, et le visiteur ne s'engage que sur
   * celui qu'il a coché. Voir `VERSION_DU_TEXTE_WHATSAPP`.
   */
  consentementWhatsapp?: boolean;
  /** D'où vient la demande, pour mesurer ce qui amène les prospects. */
  origine: string;
  /** Les réponses aux questions du projet, par code de question. Toutes facultatives. */
  declarations?: Record<string, string>;
};

/**
 * Une question que le site pose au visiteur avant qu'un responsable le rappelle.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ ELLE VIENT DU RÉFÉRENTIEL DU CABINET, ET LE SITE N'EN ÉCRIT AUCUNE.
 *
 * Le cabinet l'a demandé le 14 octobre 2026 : une information ne se saisit pas
 * deux fois. Ce que le visiteur répond ici ouvre la qualification de son dossier
 * déjà remplie, et le responsable ne le lui redemande pas au téléphone.
 *
 * Une liste de questions recopiée dans ce fichier divergerait du questionnaire
 * du cabinet à la première question ajoutée : le site poserait une question que
 * personne ne lit, ou n'en poserait pas une que le chiffrage attend.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type QuestionAuVisiteur = {
  code: string;
  libelle: string;
  type: "ENUM" | "BOOLEEN" | "ENTIER" | "DECIMAL" | "TEXTE" | "LISTE" | string;
  valeurs: { valeur: string; libelle: string }[];
  unite: string | null;
  aide: string;
};

/**
 * Ce que le visiteur apprend de l'enregistrement.
 *
 * ⚠️ `enregistree: false` n'est pas une panne à cacher : le prospect doit savoir
 * que sa demande n'est pas dans le système du cabinet, pour ne pas attendre un
 * rappel qui ne viendra pas.
 */
export type ResultatDemande =
  | { enregistree: true; canalDeRappel: "APPEL" | "WHATSAPP" | "COURRIEL" }
  | { enregistree: false; motif: string };
