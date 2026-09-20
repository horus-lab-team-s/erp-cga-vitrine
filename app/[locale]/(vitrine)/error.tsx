"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

/**
 * Le filet, sous les quatorze pages du site public.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QU'IL Y AVAIT AVANT : UNE PAGE BLANCHE
 *
 * Mesuré en provoquant une panne sur une route d'épreuve, puis retirée : le site
 * rendait un corps VIDE en HTTP 500, que le navigateur remplaçait par la page
 * interne du cadre — « This page couldn't load. A server error occurred. »,
 * en anglais, sans marque, sans navigation, avec un numéro d'erreur brut en pied
 * de page. Aucun chemin de retour.
 *
 * Le filet est posé DANS le groupe de routes du site : la page d'erreur garde
 * donc l'en-tête, le menu et le pied. Un visiteur qui tombe sur une panne peut
 * continuer sa visite ailleurs, ce qui est la seule chose utile qu'on puisse lui
 * offrir à cet instant.
 *
 * ⚠️ CE QU'IL NE FAUT PAS AFFICHER : `error.message`.
 *
 * Le cadre le remplace par un identifiant opaque en production, mais l'habitude
 * est mauvaise et le message fuiterait en développement. `digest` est en revanche
 * affiché : c'est l'identifiant journalisé côté serveur, et le seul moyen pour un
 * visiteur de désigner SON incident quand il appelle le cabinet.
 *
 * Même raisonnement que le filet de l'espace de travail, et les deux se lisent
 * ensemble.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function ErreurVitrine({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("pages.panne");
  const commun = useTranslations("commun");

  return (
    <>
      <section className="entete-page">
        <div className="bloc entete-page__contenu">
          <span className="heros__kicker">{t("kicker")}</span>
          <h1 className="heros__titre">{t("titre")}</h1>
          <p className="heros__detail">{t("detail")}</p>
        </div>
      </section>

      <section className="section">
        <div className="bloc">
          {/* ⚠️ `role="alert"` : le message est annoncé aux lecteurs d'écran sans
              qu'il faille aller le chercher. La panne survient après le chargement,
              rien ne signalerait autrement que le contenu a changé. */}
          <p role="alert" style={{ maxWidth: "72ch" }}>
            {t("prudence")}
          </p>

          {error.digest && (
            <p style={{ maxWidth: "72ch" }}>
              {t("reference")} : <code>{error.digest}</code>
            </p>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            {/* ⚠️ `reset()` avant tout : la plupart des pannes de rendu tiennent à
                un appel qui a échoué une fois. Réessayer coûte un clic et résout
                le cas le plus fréquent, là où un retour à l'accueil fait perdre
                la page qu'on cherchait. */}
            <button type="button" className="bouton bouton--principal" onClick={reset}>
              {t("reessayer")}
            </button>
            <Link href="/" className="bouton bouton--secondaire">
              {commun("actions.retourAccueil")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
