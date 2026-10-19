import type { Metadata } from "next";

import { dateCourte } from "@/app/lib/formats";
import { ETAPES_DE_MISSION, lireMaMission } from "@/app/lib/ma-mission";

export const metadata: Metadata = {
  title: "Ma demande au cabinet",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Le suivi d'une prestation ponctuelle, ouvert par le lien des courriels (19 octobre 2026,
 * point 22).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI
 *
 * Le client recevait « votre demande est prise en charge », puis « votre livrable est
 * prêt », et rien entre les deux ni après : il appelait pour savoir où en était
 * l'analyse de son bail, puis pour qu'on lui renvoie le livrable. La page dit l'étape,
 * et remet le livrable une fois validé par un second relecteur.
 *
 * ⚠️ Même parti que « Mon dossier » : lien signé, sans compte, même refus pour un lien
 * faux et une mission inconnue, page non indexée.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default async function PageMaMission({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; identifiant: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { identifiant } = await params;
  const { s = "" } = await searchParams;
  const lecture = await lireMaMission(identifiant, s);

  if ("echec" in lecture) {
    return (
      <main className="proforma">
        <section className="bloc proforma__bloc">
          <div className="proforma__carte">
            <h1 className="proforma__titre">Ce lien ne s&rsquo;ouvre pas</h1>
            <p className="proforma__texte">{lecture.echec}</p>
          </div>
        </section>
      </main>
    );
  }

  const courante = ETAPES_DE_MISSION.findIndex((e) => e.code === lecture.etat);
  const livree = lecture.etat === "LIVREE";
  const lienDuLivrable = `/api/ma-mission/${encodeURIComponent(identifiant)}/livrable?${new URLSearchParams({ s })}`;

  return (
    <main className="proforma">
      <section className="bloc proforma__bloc">
        <div className="proforma__carte">
          <p className="proforma__surtitre">
            {lecture.prestation} · ouverte le {dateCourte(lecture.ouverte_le.slice(0, 10))}
          </p>
          <h1 className="proforma__titre">{lecture.objet}</h1>

          <ol className="jalons" aria-label="Les étapes de votre demande">
            {ETAPES_DE_MISSION.map((e, i) => {
              const etat = livree || i < courante ? "faite" : i === courante ? "en-cours" : "a-venir";
              return (
                <li
                  key={e.code}
                  className="jalons__etape"
                  data-etat={etat}
                  aria-current={etat === "en-cours" ? "step" : undefined}
                >
                  <span className="jalons__pastille" aria-hidden="true">
                    {etat === "faite" ? "✓" : i + 1}
                  </span>
                  <span className="jalons__nom">
                    {e.nom}
                    <span className="depot__invisible">
                      {etat === "faite" ? " : fait" : etat === "en-cours" ? " : en cours" : " : à venir"}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="suivi__encart">
            {livree ? (
              <>
                <p style={{ margin: 0 }}>
                  <span className="suivi__etiquette">C&rsquo;est prêt</span> Votre livrable a été relu et validé
                  {lecture.livree_le ? ` le ${dateCourte(lecture.livree_le.slice(0, 10))}` : ""}.
                </p>
                {lecture.livrable && (
                  <p style={{ margin: 0 }}>
                    <a className="bouton bouton--principal" href={lienDuLivrable} target="_blank" rel="noopener">
                      Ouvrir mon livrable (PDF)
                    </a>
                  </p>
                )}
              </>
            ) : lecture.etat === "A_VALIDER" ? (
              <p style={{ margin: 0 }}>
                <span className="suivi__etiquette">En ce moment</span> Le travail est fait ; un second juriste du
                cabinet le relit avant de vous le remettre.
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                <span className="suivi__etiquette">En ce moment</span> Un juriste du cabinet instruit votre demande.
                Vous serez prévenu par courriel dès que le livrable sera prêt.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
