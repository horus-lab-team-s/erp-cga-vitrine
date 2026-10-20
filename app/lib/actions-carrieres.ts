"use server";

/**
 * Postuler à une offre (16 octobre 2026) : les coordonnées et le CV partent au backend, qui
 * vérifie que l'offre est ouverte et que le CV est bien un PDF.
 */

import { appeler, ErreurApi } from "./api";

export type EtatCandidature = { envoyee: boolean; message: string | null };

const CINQ_MO = 5 * 1024 * 1024;

export async function postuler(_precedent: EtatCandidature, donnees: FormData): Promise<EtatCandidature> {
  const offre = String(donnees.get("offre") ?? "");
  const nom = String(donnees.get("nom") ?? "").trim();
  const telephone = String(donnees.get("telephone") ?? "").trim();
  const cv = donnees.get("cv");
  if (donnees.get("consentement") !== "on") {
    return { envoyee: false, message: "Sans votre accord, la candidature ne peut pas être enregistrée." };
  }
  if (nom.length < 2) return { envoyee: false, message: "Indiquez votre nom." };
  if (telephone.replace(/\D/g, "").length < 8) return { envoyee: false, message: "Le numéro de téléphone est incomplet." };
  if (!(cv instanceof File) || cv.size === 0) return { envoyee: false, message: "Joignez votre CV en PDF." };
  if (cv.size > CINQ_MO) return { envoyee: false, message: "Le CV dépasse 5 Mo." };

  const envoi = new FormData();
  envoi.set("nom", nom);
  envoi.set("telephone", telephone);
  const courriel = String(donnees.get("courriel") ?? "").trim();
  if (courriel) envoi.set("courriel", courriel);
  envoi.set("message", String(donnees.get("message") ?? "").trim());
  envoi.set("cv", cv, cv.name);
  try {
    const accuse = await appeler<{ recue: boolean; message: string }>(
      `/vitrine/offres/${encodeURIComponent(offre)}/candidatures`,
      { methode: "POST", formulaire: envoi },
    );
    return { envoyee: accuse.recue, message: accuse.message };
  } catch (erreur) {
    if (erreur instanceof ErreurApi) return { envoyee: false, message: erreur.message };
    throw erreur;
  }
}
