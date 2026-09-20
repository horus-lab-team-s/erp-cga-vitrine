import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/**
 * Page « introuvable » du site public.
 *
 * ⚠️ ELLE PROPOSE UNE SUITE, ELLE NE SE CONTENTE PAS DE CONSTATER.
 *
 * Une page 404 qui dit seulement « cette page n'existe pas » renvoie le visiteur
 * au bouton « précédent », lequel ne mène nulle part s'il est arrivé par un lien
 * partagé sur WhatsApp. Les quatre pistes couvrent ce pour quoi on vient sur ce
 * site : un service, l'adhésion, une création d'entreprise, ou joindre quelqu'un.
 *
 * ⚠️ Pas de photographie en bannière, contrairement aux autres pages intérieures.
 * Le § 10.7 l'admet sur la vitrine, mais une image de circonstance sur une page
 * d'erreur donne à l'incident un air soigné qu'il n'a pas : l'aplat d'indigo dit
 * la même chose et se charge instantanément, ce qui compte quand on vient
 * justement de tomber sur un lien mort.
 */
export default async function PageIntrouvable() {
  const t = await getTranslations("pages.introuvable");
  const pistes = t.raw("pistes") as {
    titre: string;
    detail: string;
    lien: string;
  }[];

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
          {/* ⚠️ `titre-section` et non `avantage__titre`. Ce dernier est le
              titre INTERNE d'une carte, écrit en blanc pour le fond indigo :
              posé sur la section claire, il s'effaçait sur le blanc et la
              phrase disparaissait. `titre-section` est le titre de section du
              site, en encre sombre, et c'est celui que les autres pages
              emploient au même endroit. */}
          <h2 className="titre-section">{t("pistesTitre")}</h2>
          {/* ⚠️ `grille--4` et non `grille--2` : les variantes ne comptent pas
              des colonnes, elles fixent une LARGEUR MINIMALE par carte, et la
              grille en place autant qu'il en tient. Avec `--2` et son plancher
              de 320 px, les quatre pistes se rangeaient en trois plus une. */}
          <div className="grille grille--4">
            {pistes.map((piste) => (
              // ⚠️ `avantage--clair` et non `avantage` seul : la carte d'origine
              // est dessinée pour le fond indigo, avec un blanc à 6 % d'opacité.
              // Posée sur une section claire, elle aurait été invisible, et les
              // quatre pistes se seraient présentées comme quatre titres nus.
              <Link
                key={piste.lien}
                href={piste.lien}
                className="avantage avantage--clair"
              >
                <h3 className="avantage__titre">{piste.titre}</h3>
                <p className="avantage__detail">{piste.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
