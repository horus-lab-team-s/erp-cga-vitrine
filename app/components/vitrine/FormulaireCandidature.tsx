"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { postuler, type EtatCandidature } from "@/app/lib/actions-carrieres";

const INITIAL: EtatCandidature = { envoyee: false, message: null };

/** Postuler à une offre : coordonnées, motivation, CV en PDF (16 octobre 2026). */
export function FormulaireCandidature({ offre }: { offre: string }) {
  const t = useTranslations("pages.carrieres");
  const [etat, envoyer, enEnvoi] = useActionState(postuler, INITIAL);

  if (etat.envoyee) {
    return (
      <p className="candidature__recue" role="status">
        {etat.message}
      </p>
    );
  }
  return (
    <form action={envoyer} className="candidature">
      <input type="hidden" name="offre" value={offre} />
      <label>
        {t("champNom")}
        <input name="nom" required minLength={2} maxLength={120} autoComplete="name" />
      </label>
      <label>
        {t("champTel")}
        <input name="telephone" type="tel" required autoComplete="tel" />
      </label>
      <label>
        {t("champMail")}
        <input name="courriel" type="email" autoComplete="email" />
      </label>
      <label className="candidature__large">
        {t("champMessage")}
        <textarea name="message" rows={4} maxLength={3000} />
      </label>
      <label className="candidature__large">
        {t("champCv")}
        <input name="cv" type="file" accept="application/pdf" required />
      </label>
      <label className="candidature__large candidature__case">
        <input name="consentement" type="checkbox" required />
        {t("consentement")}
      </label>
      <button type="submit" className="bouton bouton--principal" disabled={enEnvoi}>
        {enEnvoi ? t("envoi") : t("envoyer")}
      </button>
      {etat.message && (
        <p className="candidature__echec" role="alert">
          {etat.message}
        </p>
      )}
    </form>
  );
}
