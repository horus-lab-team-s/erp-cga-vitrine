import type { Metadata } from "next";
import { dateCourte } from "@/app/lib/formats";

import { DepotDePiece } from "@/app/components/vitrine/DepotDePiece";
import { lireMonDossier } from "@/app/lib/actions-creation-suivi";
import { ADRESSE_CONNEXION } from "@/app/lib/adresse-console";
import { ETAPES_DE_CREATION, positionDansLaCreation } from "@/app/lib/etapes-de-creation";

export const metadata: Metadata = {
  title: "Mon dossier de création",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Le suivi de formalité, ouvert par un lien signé, sans compte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * D'OÙ VIENT LA CLIENTE
 *
 * Du courriel reçu à l'ouverture de son dossier, juste après son règlement. Elle
 * ouvre donc cette page sur un TÉLÉPHONE, le plus souvent, et pour y
 * photographier des documents. Elle est dessinée d'abord pour 360 px.
 *
 * ⚠️ POURQUOI ELLE EXISTE
 *
 * Entre son règlement et son immatriculation, elle n'avait rien. Le canal prévu
 * était la messagerie instantanée ; elle ne tient pas, sa fenêtre de service se
 * refermant vingt-quatre heures après le dernier mot du client, et une formalité
 * durant des semaines.
 *
 * ⚠️ LE LIEN N'EXPIRE PAS, ET C'EST VOULU
 *
 * Sa durée de vie est celle du dossier. Inventer trente ou quatre-vingt-dix
 * jours l'aurait enfermée dehors au milieu de sa formalité ; le sceller sur
 * l'étape l'aurait invalidé à chaque jalon franchi, c'est-à-dire précisément
 * quand elle a une raison de revenir.
 *
 * ⚠️ UN LIEN QUI NE VAUT PAS NE MONTRE RIEN
 *
 * Sceau faux, absent, ou dossier inconnu : le serveur rend le même refus dans
 * les trois cas, et la page n'en dit pas plus. Distinguer les trois permettrait
 * d'énumérer les dossiers en lisant les réponses.
 *
 * ⚠️ AUCUNE INDEXATION : la page est nominative. `robots` le dit, et le
 * `robots.txt` de la vitrine protège déjà les chemins de ce genre.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default async function PageMonDossier({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; reference: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { reference } = await params;
  const { s = "" } = await searchParams;
  const lecture = await lireMonDossier(reference, s);

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

  // ⚠️ LA PAGE DIT OÙ ELLE EN EST, CE QUI VIENT, ET CE QU'ON ATTEND D'ELLE (14 octobre 2026).
  //
  // Le cabinet l'a demandée « plus soft et plus indicative ». Elle disait l'étape
  // en une phrase, sans la situer dans le parcours. La frise et les deux encarts
  // viennent de `etapes-de-creation.ts`, en double dans la console : connectée ou
  // par ce lien, elle lit la même chose.
  //
  // ⚠️ L'étape ne contredit pas les numéros : voir `positionDansLaCreation`.
  const position = positionDansLaCreation(lecture.etape, lecture.identifiants.immatriculee);
  const etape = ETAPES_DE_CREATION[position.courante];
  const attendues = lecture.pieces.filter((p) => p.obligatoire);
  const recues = attendues.filter((p) => p.fournie).length;
  const manquantes = lecture.pieces.filter((p) => !p.fournie);
  const fournies = lecture.pieces.filter((p) => p.fournie);

  return (
    <main className="proforma">
      <section className="bloc proforma__bloc">
        <div className="proforma__carte">
          <p className="proforma__surtitre">Votre société en création · {lecture.forme_juridique}</p>
          <h1 className="proforma__titre">{lecture.denomination_souhaitee}</h1>

          {position.abandonnee ? (
            <p className="proforma__texte">
              <strong>Ce dossier est clos.</strong> Contactez le cabinet si vous pensez qu&rsquo;il
              s&rsquo;agit d&rsquo;une erreur.
            </p>
          ) : (
            <>
              {/* ⚠️ Une liste ordonnée : un lecteur d'écran annonce « étape 3 sur 6, en
                  cours », ce qu'une rangée de cercles colorés ne dirait à personne. */}
              <ol className="jalons" aria-label="Les étapes de votre création">
                {ETAPES_DE_CREATION.map((e, i) => {
                  const etat =
                    position.terminee || i < position.courante
                      ? "faite"
                      : i === position.courante
                        ? "en-cours"
                        : "a-venir";
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
                {position.terminee ? (
                  <p>
                    <strong>Votre société est créée.</strong> Toutes les étapes sont franchies.
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="suivi__etiquette">En ce moment</span>
                      {etape.cabinet}
                    </p>
                    <p>
                      <span className="suivi__etiquette">De votre côté</span>
                      {etape.vous ??
                        "Rien à faire pour l’instant. Le cabinet vous écrit à chaque étape franchie."}
                    </p>
                  </>
                )}
              </div>
            </>
          )}

          {/*
            ⚠️ LES NUMÉROS D'ABORD, DÈS QU'ILS EXISTENT.

            C'est la nouvelle qu'elle attend depuis le premier jour. Chaque numéro
            vient avec sa date : « obtenu le » est ce qu'une banque demande. La
            patente et la CNPS suivent souvent de plusieurs semaines : on ne les
            affiche que lorsqu'elles arrivent.
          */}
          {lecture.identifiants.immatriculee && (
            <div className="proforma__detail">
              <h2 className="proforma__intertitre">Vos numéros</h2>
              <dl className="proforma__lignes">
                {(
                  [
                    ["RCCM", lecture.identifiants.rccm, lecture.identifiants.rccm_obtenu_le],
                    ["Numéro de contribuable", lecture.identifiants.niu, lecture.identifiants.niu_obtenu_le],
                    ["Patente", lecture.identifiants.patente, lecture.identifiants.patente_obtenue_le],
                    ["Numéro CNPS", lecture.identifiants.cnps, lecture.identifiants.cnps_obtenu_le],
                  ] as const
                )
                  .filter(([, numero]) => numero)
                  .map(([libelle, numero, obtenu]) => (
                    <div key={libelle} className="proforma__ligne">
                      <dt>{libelle}</dt>
                      <dd className="tabulaire">
                        {numero}
                        {obtenu ? ` · obtenu le ${dateCourte(obtenu)}` : ""}
                      </dd>
                    </div>
                  ))}
              </dl>
              <p className="proforma__texte">
                Conservez ces numéros : votre banque, vos fournisseurs et
                l’administration vous les demanderont.
              </p>
            </div>
          )}

          {attendues.length > 0 && (
            <>
              <h2 className="proforma__intertitre">Vos documents</h2>
              {/* ⚠️ Le compte ne retient que ce qui est nécessaire : une pièce
                  d'usage absente n'empêche pas le dépôt, et la compter ferait
                  courir après un document dont personne n'a besoin. */}
              <p className="proforma__texte">
                <strong>
                  {recues} sur {attendues.length}
                </strong>{" "}
                documents nécessaires reçus
              </p>
              <progress className="suivi__jauge" max={attendues.length} value={recues}>
                {recues} sur {attendues.length}
              </progress>
            </>
          )}

          {!lecture.clos && manquantes.length > 0 && (
            <ul className="suivi__liste">
              {manquantes.map((piece) => (
                <li key={piece.code} className="suivi__ligne">
                  <span>
                    {piece.libelle}
                    {!piece.obligatoire && " (facultatif)"}
                  </span>
                  <DepotDePiece
                    reference={lecture.reference}
                    sceau={s}
                    code={piece.code}
                    libelle={piece.libelle}
                  />
                </li>
              ))}
            </ul>
          )}

          {fournies.length > 0 && (
            <details className="suivi__recus">
              <summary>Déjà reçus ({fournies.length})</summary>
              <ul className="suivi__liste">
                {fournies.map((piece) => (
                  <li key={piece.code} className="suivi__ligne">
                    <span>{piece.libelle}</span>
                    <span className="suivi__mention">
                      reçu{piece.fournie_le ? ` le ${dateCourte(piece.fournie_le)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* ⚠️ Le compte s'ajoute au lien (14 octobre 2026) : elle a reçu, dans le même
              courriel, de quoi choisir son mot de passe. On le lui rappelle sans
              l'imposer : ce lien suffit pour tout ce que la page permet. */}
          <p className="suivi__mention">
            Vous avez choisi un mot de passe ? Retrouvez ce dossier dans{" "}
            <a href={ADRESSE_CONNEXION}>votre espace client</a>. Sinon, conservez ce lien : il reste
            valable jusqu&rsquo;à l&rsquo;immatriculation de votre société. Ne le transférez pas, il ouvre
            votre dossier sans mot de passe.
          </p>
        </div>
      </section>
    </main>
  );
}
