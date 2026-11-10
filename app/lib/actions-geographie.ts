"use server";

/**
 * Le référentiel géographique du Cameroun, servi au formulaire de création (8 novembre 2026).
 *
 * Réunion du 4 novembre avec la responsable : la ville dit le centre de formalités, le quartier
 * le centre des impôts. Le visiteur choisit donc région › département › arrondissement ›
 * ville › quartier au lieu de taper une région. Voir `Docs/referentiel/geographie/` du serveur.
 *
 * ⚠️ UNE PANNE REND `null`, JAMAIS UNE ERREUR : la localisation est une aide. Sans elle, le
 * formulaire garde ses champs libres et la demande part quand même.
 */

import { appeler } from "./api";
import type { Decoupage, LieuxDeLArrondissement } from "./geographie";

/** Le découpage officiel (10 régions, 58 départements, 360 arrondissements). Mis en cache une journée. */
export async function lireLeDecoupage(): Promise<Decoupage | null> {
  try {
    return await appeler<Decoupage>("/referentiel/geographie/decoupage", { cache: 86400 });
  } catch {
    return null;
  }
}

/** Les villes, localités et quartiers d'UN arrondissement. */
export async function lireLesLieux(code: string): Promise<LieuxDeLArrondissement | null> {
  if (!/^CM\d{9}$/.test(code)) return null;
  try {
    return await appeler<LieuxDeLArrondissement>(
      `/referentiel/geographie/arrondissements/${code}/lieux`,
      { cache: 86400 },
    );
  } catch {
    return null;
  }
}
