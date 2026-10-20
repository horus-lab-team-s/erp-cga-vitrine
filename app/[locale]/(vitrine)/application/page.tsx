import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";
import { alternatives } from "@/app/lib/site";

import { EnteteDePage } from "@/app/components/vitrine/EnteteDePage";
import { IconeVitrine } from "@/app/components/vitrine/IconeVitrine";
import {
  BoutonDeTelechargement,
  ECRANS_DE_L_APPLICATION,
} from "@/app/components/vitrine/TelechargementApplication";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.application" });
  return {
    alternates: alternatives(locale, "/application"), title: t("titre"), description: t("detail") };
}

/**
 * Page « Application mobile » (20 octobre 2026) : ce que l'adhérent y fait, ses
 * écrans, et où la télécharger.
 *
 * ⚠️ Le téléchargement vient EN PREMIER, sous le bandeau : c'est ce que le visiteur
 * est venu chercher. Les écrans et les questions suivent, pour qui hésite encore.
 */
export default async function Application({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Ouverture />
      <Telechargement />
      <Ecrans />
      <Questions />
    </>
  );
}

function Ouverture() {
  const t = useTranslations("pages.application");
  return (
    <EnteteDePage
      kicker={t("kicker")}
      titre={t("titre")}
      detail={t("detail")}
      detailSurDeuxLignes
      images={["/images/pages/creation-a.jpg"]}
    />
  );
}

function Telechargement() {
  const t = useTranslations("pages.application");
  return (
    <section className="section section--filigrane" id="telecharger">
      <div className="bloc application">
        <div className="application__texte">
          <span className="kicker">{t("telechargement.kicker")}</span>
          <h2 className="titre-section">{t("telechargement.titre")}</h2>
          <p className="chapeau">{t("telechargement.detail")}</p>
          <BoutonDeTelechargement />
          <ol className="application__etapes">
            {(["installer", "connecter", "deposer"] as const).map((cle) => (
              <li key={cle}>{t(`telechargement.etapes.${cle}`)}</li>
            ))}
          </ol>
        </div>
        <div className="application__telephone">
          <Image
            src={ECRANS_DE_L_APPLICATION[0].image}
            alt={t("ecrans.accueil.alt")}
            width={540}
            height={1140}
            priority
            sizes="(max-width: 980px) 60vw, 280px"
          />
        </div>
      </div>
    </section>
  );
}

function Ecrans() {
  const t = useTranslations("pages.application");
  return (
    <section className="section section--centre">
      <div className="bloc">
        <span className="kicker">{t("ecrans.kicker")}</span>
        <h2 className="titre-section">{t("ecrans.titre")}</h2>
        <div className="grille grille--4 application__galerie">
          {ECRANS_DE_L_APPLICATION.map((ecran) => (
            <figure key={ecran.cle} className="application__ecran">
              <Image
                src={ecran.image}
                alt={t(`ecrans.${ecran.cle}.alt`)}
                width={540}
                height={1140}
                sizes="(max-width: 980px) 70vw, 240px"
              />
              <figcaption>
                <strong>{t(`ecrans.${ecran.cle}.titre`)}</strong>
                <span>{t(`ecrans.${ecran.cle}.detail`)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Questions() {
  const t = useTranslations("pages.application.questions");
  return (
    <section className="section">
      <div className="bloc application__questions">
        <h2 className="titre-section">{t("titre")}</h2>
        {(["compte", "iphone", "reseau", "donnees"] as const).map((cle) => (
          <details key={cle} className="application__question">
            <summary>
              {t(`${cle}.q`)}
              <IconeVitrine nom="chevronBas" taille={16} />
            </summary>
            <p>{t(`${cle}.r`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
