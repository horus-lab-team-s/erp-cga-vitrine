import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { EnteteDePage } from "@/app/components/vitrine/EnteteDePage";
import { lireLesOffres, type OffreDePoste } from "@/app/lib/carrieres";
import { dateLongue } from "@/app/lib/formats";
import { Link } from "@/i18n/navigation";

// Les offres changent quand le cabinet publie : la page se construit à la demande.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.carrieres" });
  return { title: t("titre"), description: t("detail") };
}

/**
 * « Carrières » (16 octobre 2026) : les postes ouverts au cabinet. Chaque offre s'ouvre sur
 * sa page, où le candidat lit les qualifications avant de postuler.
 */
export default async function Carrieres({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pages.carrieres");
  // Le backend en panne ne fait pas tomber la page : elle dit qu'aucun poste n'est ouvert.
  const offres: OffreDePoste[] = await lireLesOffres().catch(() => []);
  return (
    <>
      <EnteteDePage
        kicker={t("kicker")}
        titre={t("titre")}
        detail={t("detail")}
        images={["/images/pages/cabinet-a.jpg", "/images/pages/cabinet-b.jpg"]}
      />
      <section className="section carrieres">
        <div className="bloc">
          {offres.length === 0 ? (
            <p className="carrieres__vide">{t("aucune")}</p>
          ) : (
            <ul className="carrieres__liste">
              {offres.map((o) => (
                <li key={o.identifiant} className="carrieres__offre">
                  {o.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- relayée par la route de la vitrine
                    <img className="carrieres__vignette" src={`/api/carrieres/${o.identifiant}/image`} alt="" loading="lazy" />
                  )}
                  <h2>{o.intitule}</h2>
                  <p className="carrieres__meta">
                    {o.lieu} · {t(`contrats.${o.type_de_contrat}`)}
                    {o.date_limite ? ` · ${t("jusquau")} ${dateLongue(o.date_limite)}` : ""}
                  </p>
                  <Link href={`/carrieres/${o.identifiant}`} className="bouton bouton--secondaire">
                    {t("voir")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
