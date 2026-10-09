import type { Metadata } from "next";
import { dateCourte } from "@/app/lib/formats";

import { DepotDePiece } from "@/app/components/vitrine/DepotDePiece";
import { lireMonDossier } from "@/app/lib/actions-creation-suivi";

export const metadata: Metadata = {
  title: "Mon dossier de création",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Les étapes, dans les mots de la cliente. Le code du domaine ne lui dit rien. */
const ETAPES: Record<string, { titre: string; detail: string }> = {
  QUALIFICATION: {
    titre: "Nous réunissons vos pièces",
    detail: "Envoyez les documents de la liste ci-dessous. Le cabinet vous dira si l’un d’eux doit être repris.",
  },
  CONSTITUTION: {
    titre: "Nous préparons vos statuts",
    detail: "Vos pièces sont réunies. Le cabinet constitue le dossier à déposer.",
  },
  DEPOT_CFCE: {
    titre: "Votre dossier est déposé au CFCE",
    detail: "Il suit son cours au guichet unique. Vous n’avez rien à faire pour l’instant.",
  },
  SUIVI_IMMATRICULATION: {
    titre: "Votre immatriculation est en cours",
    detail: "Le cabinet suit le greffe et récupère vos numéros dès qu’ils sont délivrés.",
  },
  LIVRAISON: {
    titre: "Vos documents vous sont remis",
    detail: "Le cabinet vous contacte pour la remise de vos originaux.",
  },
  CONVERTI: {
    titre: "Votre société est immatriculée",
    detail: "Félicitations. Le cabinet vous a écrit séparément pour la suite.",
  },
  ABANDONNE: {
    titre: "Ce dossier est clos",
    detail: "Contactez le cabinet si vous pensez qu’il s’agit d’une erreur.",
  },
};

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

  // ⚠️ L'ÉTAPE NE DOIT PAS CONTREDIRE LES NUMÉROS AFFICHÉS JUSTE EN DESSOUS.
  //
  // Le RCCM et le NIU arrivent PENDANT `SUIVI_IMMATRICULATION` : l'étape ne
  // change qu'au passage à la livraison, qui est un geste du cabinet et peut
  // suivre de plusieurs jours. La page annonçait donc « votre immatriculation
  // est en cours », puis, deux lignes plus bas, « votre société est
  // immatriculée » avec les numéros.
  //
  // Vu en relisant la page rendue, pas en écrivant le code : les deux blocs
  // sont justes séparément.
  const etape =
    lecture.identifiants.immatriculee && lecture.etape === "SUIVI_IMMATRICULATION"
      ? {
          titre: "Votre société est immatriculée",
          detail:
            "Vos numéros sont délivrés. Le cabinet réunit vos originaux et vous contacte pour la remise.",
        }
      : (ETAPES[lecture.etape] ?? {
          titre: "Votre dossier avance",
          detail: "Le cabinet vous tient informée.",
        });
  const manquantes = lecture.pieces.filter((p) => !p.fournie);
  const fournies = lecture.pieces.filter((p) => p.fournie);

  return (
    <main className="proforma">
      <section className="bloc proforma__bloc">
        <div className="proforma__carte">
          <p className="proforma__surtitre">Votre dossier de création</p>
          <h1 className="proforma__titre">{lecture.denomination_souhaitee}</h1>
          <p className="proforma__texte">
            <strong>{etape.titre}</strong>
            <br />
            {etape.detail}
          </p>

          {/*
            ⚠️ LES NUMÉROS D'ABORD, DÈS QU'ILS EXISTENT.

            C'est la nouvelle qu'elle attend depuis le premier jour, et elle
            passait à la trappe : la page la menait jusqu'à « votre
            immatriculation est en cours » sans jamais lui dire que sa société
            existait, alors que le cabinet, lui, voyait le RCCM au dossier.

            Chaque numéro vient avec sa date : « obtenu le » est ce qu'une
            banque demande. La patente et la CNPS suivent souvent de plusieurs
            semaines, et leur absence ne veut pas dire qu'il manque quelque
            chose : on ne les affiche que lorsqu'elles arrivent.
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

          {/* ⚠️ Le compte ne retient que ce qui BLOQUE : une pièce d'usage
              absente n'empêche pas le dépôt, et l'annoncer comme manquante
              ferait courir la cliente après un document dont personne n'a
              besoin. */}
          {!lecture.clos && lecture.manquantes_bloquantes > 0 && (
            <p className="proforma__texte">
              Il nous manque{" "}
              <strong>
                {lecture.manquantes_bloquantes} document
                {lecture.manquantes_bloquantes > 1 ? "s" : ""}
              </strong>{" "}
              pour déposer votre dossier.
            </p>
          )}

          {!lecture.clos && manquantes.length > 0 && (
            <>
              <h2 className="proforma__intertitre">À envoyer</h2>
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
            </>
          )}

          {fournies.length > 0 && (
            <>
              <h2 className="proforma__intertitre">Déjà reçus</h2>
              <ul className="suivi__liste">
                {fournies.map((piece) => (
                  <li key={piece.code} className="suivi__ligne">
                    <span>{piece.libelle}</span>
                    <span className="suivi__mention">
                      reçu{piece.fournie_le ? ` le ${piece.fournie_le.split("-").reverse().join("/")}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="suivi__mention">
            Conservez le lien de ce message : il reste valable jusqu&rsquo;à
            l&rsquo;immatriculation de votre société. Ne le transférez pas, il
            ouvre votre dossier sans mot de passe.
          </p>
        </div>
      </section>
    </main>
  );
}
