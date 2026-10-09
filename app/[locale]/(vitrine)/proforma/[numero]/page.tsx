import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AcceptationProforma } from "@/app/components/vitrine/AcceptationProforma";
import { consulterLaProforma } from "@/app/lib/actions-acquisition";

// ⚠️ Jamais indexée : son adresse porte un sceau qui vaut authentification.
export const metadata: Metadata = {
  title: "Votre proposition",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function francs(valeur: string): string {
  return `${Number(valeur).toLocaleString("fr-FR")} FCFA`;
}

/**
 * Le nom lisible d'un service du parcours d'acquisition.
 *
 * ⚠️ Le serveur ne rend que le CODE du catalogue (`CREATION`) : un code n'a
 * rien à faire sous les yeux d'un client qui s'apprête à s'engager. Les services
 * connus ont leur libellé ; un service ajouté plus tard au référentiel s'affiche
 * au moins sans tirets, avec une majuscule, en attendant le sien.
 */
const LIBELLES_DES_SERVICES: Record<string, string> = {
  // ⚠️ Les codes du CATALOGUE depuis le 27 septembre : le référentiel de
  // qualification portait « creation-sarl » et « tenue-comptable », qui ne
  // correspondaient à rien de ce que le site envoie. Voir le README de
  // `Docs/referentiel/qualification`.
  CREATION: "Création d’entreprise",
  ADHESION: "Adhésion et suivi comptable",
  DOMICILIATION: "Domiciliation commerciale",
  FORMATION: "Formation",
  PONCTUEL: "Prestation ponctuelle",
};

function libelleDuService(code: string): string {
  const connu = LIBELLES_DES_SERVICES[code];
  if (connu) return connu;
  const lisible = code.replaceAll("-", " ");
  return lisible.charAt(0).toUpperCase() + lisible.slice(1);
}

/**
 * La page où le client lit sa proforma et l'accepte, sans compte (pas 67).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * D'OÙ VIENT LE CLIENT
 *
 * Du courriel ou du message WhatsApp que le cabinet lui a envoyé après l'échange,
 * quand le responsable a arrêté le prix. Il ouvre donc cette page sur un
 * TÉLÉPHONE, le plus souvent : elle est dessinée d'abord pour 360 px.
 *
 * ⚠️ LE CLIENT VOIT CE QU'IL ACCEPTE
 *
 * Le prix et ce qui le compose, les débours, l'échéance du lien. Rien de ce qui est
 * interne au cabinet : ni l'intervalle du barème, ni qui a chiffré.
 *
 * ⚠️ UN LIEN QUI NE VAUT PAS NE MONTRE RIEN
 *
 * Sceau faux, expiré, ou numéro inconnu : le backend refuse avant de lire, et la page
 * affiche son refus sans rien révéler de plus.
 *
 * ⚠️ UNE PROFORMA ACCEPTÉE, REMPLACÉE OU ANNULÉE NE PROPOSE PAS D'ACCEPTER
 *
 * Le domaine le refuserait ; l'écran ne propose pas un geste refusé.
 *
 * ⚠️ AUCUNE ANNONCE PROMOTIONNELLE ICI (voir `BandeauAnnonce`) : un prix d'appel
 * affiché par-dessus une proposition chiffrée pour ce client le ferait douter du
 * montant qu'il s'apprête à accepter.
 *
 * Les textes sont en français : la traduction de la vitrine pour cette page reste à faire.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default async function PageProforma({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; numero: string }>;
  searchParams: Promise<{ v?: string; e?: string; s?: string }>;
}) {
  const { locale, numero } = await params;
  // Le numéro WhatsApp du cabinet : la même source que le reste de la vitrine.
  const commun = await getTranslations({ locale, namespace: "commun" });
  const whatsappDuCabinet = `https://wa.me/${commun("cabinet.whatsapp").replace(/\D/g, "")}`;
  const { v = "", e = "", s = "" } = await searchParams;
  const lecture = await consulterLaProforma({ numero, version: v, expire_le: e, sceau: s });

  if ("echec" in lecture) {
    return (
      <main className="proforma">
        <section className="bloc proforma__bloc">
          <div className="proforma__carte">
            <h1 className="proforma__titre">Ce lien ne s&rsquo;ouvre pas</h1>
            <p role="alert" className="proforma__texte">
              Il a peut-être expiré, ou il a été modifié en chemin. Demandez au cabinet de vous envoyer un
              nouveau lien : c&rsquo;est immédiat.
            </p>
            <a className="bouton bouton--principal" href={whatsappDuCabinet}>
              Écrire au cabinet sur WhatsApp
            </a>
          </div>
        </section>
      </main>
    );
  }

  const ouverte = !lecture.acceptee && lecture.etat !== "REMPLACEE" && lecture.etat !== "ANNULEE";
  return (
    <main className="proforma">
      <section className="bloc proforma__bloc">
        <div className="proforma__carte">
          <p className="proforma__surtitre">Proposition {lecture.numero}</p>
          <h1 className="proforma__titre">{libelleDuService(lecture.service)}</h1>
          <p className="proforma__montant">{francs(lecture.montant)}</p>
          <p className="proforma__texte">
            Le prix arrêté par le cabinet après votre échange. Lien valable jusqu&rsquo;au{" "}
            {new Date(lecture.expire_le).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
          </p>

          {lecture.lignes.length > 0 && (
            <div className="proforma__detail">
              <h2 className="proforma__intertitre">Ce qui compose le prix</h2>
              <dl className="proforma__lignes">
                {lecture.lignes.map((l) => (
                  <div key={l.libelle} className="proforma__ligne">
                    <dt>{l.libelle}</dt>
                    <dd>
                      {Number(l.montant) > 0 ? "+ " : ""}
                      {francs(l.montant)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {lecture.debours.length > 0 && (
            <div className="proforma__detail">
              <h2 className="proforma__intertitre">Frais avancés pour votre compte</h2>
              <dl className="proforma__lignes">
                {lecture.debours.map((d) => (
                  <div key={d.libelle} className="proforma__ligne">
                    <dt>{d.libelle}</dt>
                    <dd>{francs(d.montant)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/*
          ⚠️ LE DOCUMENT, AVANT L'ACCORD (pas 148).

          La page montrait le montant et ses lignes ; elle ne montrait pas le
          document. Un engagement signé sur un papier qu'on n'a pas vu ne se
          défend ni devant la cliente, ni devant un juge.

          Le lien passe par le relais du site : l'adresse de l'API est interne,
          et le navigateur ne la connaît pas.
        */}
        <p className="proforma__document">
          <a
            className="bouton bouton--secondaire"
            href={`/fr/proforma/${encodeURIComponent(lecture.numero)}/document?v=${v}&e=${encodeURIComponent(e)}&s=${encodeURIComponent(s)}`}
            target="_blank"
            rel="noopener"
          >
            Lire la proforma détaillée
          </a>
        </p>

        <div className="proforma__carte">
          {lecture.acceptee ? (
            <p role="status" className="proforma__etat proforma__etat--succes">
              Vous avez accepté cette proposition. Le cabinet vous contacte pour le règlement.
            </p>
          ) : !ouverte ? (
            <p role="status" className="proforma__etat">
              Cette proposition {lecture.etat === "REMPLACEE" ? "a été remplacée par une nouvelle version" : "a été annulée"}.
              Le cabinet vous a envoyé, ou vous enverra, le lien de la proposition en cours.
            </p>
          ) : (
            <>
              <h2 className="proforma__intertitre">Donner votre accord</h2>
              <AcceptationProforma numero={lecture.numero} version={v} expireLe={e} sceau={s} />
            </>
          )}
        </div>

        <p className="proforma__aide">
          Une question avant de valider ? Répondez au message du cabinet, ou{" "}
          <a href={whatsappDuCabinet}>écrivez-nous sur WhatsApp</a>.
        </p>
      </section>
    </main>
  );
}
