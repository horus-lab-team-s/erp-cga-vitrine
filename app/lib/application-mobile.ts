/**
 * Où se télécharge l'application mobile de l'adhérent (20 octobre 2026).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ UNE ADRESSE DE CONFIGURATION, JAMAIS ÉCRITE ICI.
 *
 * L'application n'est pas encore publiée : le cabinet choisira entre la fiche
 * Google Play et un fichier APK servi par son propre domaine. Les deux se posent
 * par `NEXT_PUBLIC_LIEN_APPLICATION_ANDROID`, au moment du build, sans toucher au
 * code. Tant qu'elle n'est pas posée, la page le dit (« bientôt disponible ») au
 * lieu d'offrir un bouton qui mènerait nulle part.
 *
 * ⚠️ HTTPS OBLIGATOIRE. Un lien en clair laisserait n'importe quel réseau de
 * passage remplacer le fichier par un autre : c'est l'application qui porte les
 * identifiants de l'adhérent. Une adresse en `http://` est donc ignorée.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** La version d'Android exigée : `minSdk` 24 de l'application, soit Android 7. */
export const ANDROID_MINIMUM = "7";

/** Le lien de téléchargement, s'il est posé et sûr ; `null` sinon. */
export function lienDeLApplication(valeur: string | undefined): string | null {
  const lien = (valeur ?? "").trim();
  if (!lien) return null;
  try {
    return new URL(lien).protocol === "https:" ? lien : null;
  } catch {
    return null;
  }
}

/** Vrai pour une fiche Google Play : le bouton en reprend le libellé. */
export function estGooglePlay(lien: string): boolean {
  return new URL(lien).hostname === "play.google.com";
}

export const LIEN_ANDROID = lienDeLApplication(process.env.NEXT_PUBLIC_LIEN_APPLICATION_ANDROID);
