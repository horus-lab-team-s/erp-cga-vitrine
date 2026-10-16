import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { EnteteDePage } from "@/app/components/vitrine/EnteteDePage";
import { FormulaireCandidature } from "@/app/components/vitrine/FormulaireCandidature";
import { TexteRiche } from "@/app/components/vitrine/TexteRiche";
import { lireUneOffre } from "@/app/lib/carrieres";
import { dateLongue } from "@/app/lib/formats";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; identifiant: string }>;
}): Promise<Metadata> {
  const { identifiant } = await params;
  const offre = await lireUneOffre(identifiant);
  return { title: offre ? offre.intitule : "Offre introuvable" };
}

/**
 * Une offre de poste (16 octobre 2026) : le poste, les qualifications attendues, puis le
 * formulaire. Les qualifications d'abord, délibérément : le candidat les lit avant de
 * postuler, comme le cabinet l'a demandé.
 */
export default async function Offre({ params }: { params: Promise<{ locale: string; identifiant: string }> }) {
  const { locale, identifiant } = await params;
  setRequestLocale(locale);
  const offre = await lireUneOffre(identifiant);
  if (!offre) notFound();
  const t = await getTranslations("pages.carrieres");
  return (
    <>
      <EnteteDePage
        kicker={t("kicker")}
        titre={offre.intitule}
        detail={`${offre.lieu} · ${t(`contrats.${offre.type_de_contrat}`)}${
          offre.date_limite ? ` · ${t("jusquau")} ${dateLongue(offre.date_limite)}` : ""
        }`}
        images={["/images/pages/cabinet-a.jpg", "/images/pages/cabinet-b.jpg"]}
      />
      <section className="section carrieres">
        <div className="bloc carrieres__detail">
          <Link href="/carrieres" className="carrieres__retour">
            ← {t("retour")}
          </Link>
          {offre.description.length > 0 && (
            <>
              <h2>{t("lePoste")}</h2>
              <TexteRiche blocs={offre.description} />
            </>
          )}
          <h2>{t("qualifications")}</h2>
          <TexteRiche blocs={offre.qualifications} />
          <h2>{t("postuler")}</h2>
          <FormulaireCandidature offre={offre.identifiant} />
        </div>
      </section>
    </>
  );
}
