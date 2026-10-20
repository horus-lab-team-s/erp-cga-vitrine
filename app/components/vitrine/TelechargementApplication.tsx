import Image from "next/image";
import { useTranslations } from "next-intl";

import { IconeVitrine } from "@/app/components/vitrine/IconeVitrine";
import { ANDROID_MINIMUM, LIEN_ANDROID, estGooglePlay } from "@/app/lib/application-mobile";
import { Link } from "@/i18n/navigation";

/** Les écrans montrés, dans l'ordre où l'adhérent les découvre. */
export const ECRANS_DE_L_APPLICATION = [
  { image: "/images/application/accueil-haut.webp", cle: "accueil" },
  { image: "/images/application/feuille-trois-choix.webp", cle: "deposer" },
  { image: "/images/application/echeances.webp", cle: "echeances" },
  { image: "/images/application/documents-carte.webp", cle: "documents" },
] as const;

/**
 * Le bouton de téléchargement, ou ce qui le remplace tant qu'il n'y a rien à
 * télécharger (20 octobre 2026). Voir `app/lib/application-mobile.ts`.
 *
 * ⚠️ Pas de bouton grisé sans explication : un visiteur qui ne peut pas cliquer doit
 * lire pourquoi, et quoi faire à la place.
 */
export function BoutonDeTelechargement() {
  const t = useTranslations("pages.application.telechargement");
  if (!LIEN_ANDROID) {
    return (
      <div className="application__attente" role="status">
        <strong>{t("bientot")}</strong>
        <span>{t("enAttendant")}</span>
      </div>
    );
  }
  return (
    <div className="application__actions">
      <a className="bouton bouton--principal bouton--large" href={LIEN_ANDROID} rel="noopener">
        <IconeVitrine nom="fleche" taille={16} />
        {estGooglePlay(LIEN_ANDROID) ? t("googlePlay") : t("android")}
      </a>
      <span className="application__note">{t("exigence", { version: ANDROID_MINIMUM })}</span>
    </div>
  );
}

/** Le rappel de l'accueil : un écran, trois raisons, et le chemin vers la page. */
export function ApplicationSurLAccueil() {
  const t = useTranslations("pages.application");
  return (
    <section className="section">
      <div className="bloc application application--accueil">
        <div className="application__texte">
          <span className="kicker">{t("kicker")}</span>
          <h2 className="titre-section">{t("accueilTitre")}</h2>
          <p className="chapeau">{t("accueilDetail")}</p>
          <ul className="application__atouts">
            {(["photo", "echeances", "horsLigne"] as const).map((cle) => (
              <li key={cle}>
                <IconeVitrine nom="coche" taille={16} />
                {t(`atouts.${cle}`)}
              </li>
            ))}
          </ul>
          <div className="application__actions">
            <Link className="bouton bouton--principal" href="/application">
              {t("accueilAction")}
              <IconeVitrine nom="fleche" taille={16} />
            </Link>
          </div>
        </div>
        <div className="application__telephone">
          <Image
            src={ECRANS_DE_L_APPLICATION[0].image}
            alt={t("ecrans.accueil.alt")}
            width={540}
            height={1140}
            sizes="(max-width: 980px) 60vw, 280px"
          />
        </div>
      </div>
    </section>
  );
}
