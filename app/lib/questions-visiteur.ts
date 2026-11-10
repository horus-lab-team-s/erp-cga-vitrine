import "server-only";

import type { Demarche, QuestionAuVisiteur } from "./acquisition";
import { appeler } from "./api";

/**
 * Les questions que le cabinet veut voir posées pour ce service.
 *
 * ⚠️ UNE PANNE REND UNE LISTE VIDE, JAMAIS UNE ERREUR. Ces questions sont un
 * gain de temps offert au visiteur, pas une condition : si le serveur ne répond
 * pas, le formulaire garde ses champs de toujours et la demande part quand même.
 * Faire tomber la page d'un service parce qu'un complément facultatif manque
 * serait perdre le prospect pour une politesse.
 */
export async function lireLesQuestionsDuVisiteur(demarche: Demarche): Promise<QuestionAuVisiteur[]> {
  try {
    const reponse = await appeler<{ questions: QuestionAuVisiteur[] }>(
      `/acquisition/questionnaires/${encodeURIComponent(demarche)}/visiteur`,
    );
    return Array.isArray(reponse?.questions) ? reponse.questions : [];
  } catch {
    return [];
  }
}
