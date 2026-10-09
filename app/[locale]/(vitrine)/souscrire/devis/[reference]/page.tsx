import type { Metadata } from "next";

import { EngagementDevis, RappelDuDevis } from "@/app/components/vitrine/FormulaireSouscription";
import { dateCourte, montantFcfa } from "@/app/lib/formats";
import { aujourdhui } from "@/app/lib/portefeuille";
import { lireDevis } from "@/app/lib/souscription";
import { Link } from "@/i18n/navigation";

// ⚠️ Jamais indexée : sa référence protège le devis, et elle ne doit pas finir dans un moteur.
export const metadata: Metadata = {
  title: "Votre devis",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Le devis établi en ligne, et l'engagement (pas 83).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LE DEVIS AFFICHE LES MONTANTS FIGÉS
 *
 * Recopiés du barème du jour de l'établissement : un devis ouvert trois semaines plus
 * tard montre le prix promis, pas celui du jour.
 *
 * ⚠️ UN DEVIS ENGAGÉ, CADUC OU INCOMPLET NE PROPOSE PAS DE PAYER
 *
 * Le backend refuserait ; l'écran ne propose pas un geste refusé. Un devis engagé renvoie
 * au suivi de sa souscription. Un devis incomplet (une ligne sur étude) renvoie au cabinet.
 * Un devis dont un prix n'a pas été arrêté par le gérant (`prix_arretes`) aussi.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default async function PageDevis({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const lecture = await lireDevis(reference);

  // ⚠️ La mise en page de la proforma (`.proforma*`, vitrine.css) : même lecteur,
  // même téléphone, même en-tête fixe à dégager. La classe `conteneur` employée
  // ici n'existait nulle part, et le titre passait sous l'en-tête.
  return (
    <main className="proforma">
      <section className="bloc proforma__bloc">
        {"echec" in lecture ? (
          <div className="proforma__carte">
            <h1 className="proforma__titre">Votre devis</h1>
            <p role="alert" className="proforma__texte">
              {lecture.statut === 404
                ? "Ce devis est introuvable. Vérifiez le lien, ou établissez un nouveau devis."
                : `Le devis ne peut pas être lu pour le moment (${lecture.echec}).`}{" "}
              <Link href="/souscrire">Établir un devis</Link>
            </p>
          </div>
        ) : (
          <Devis devis={lecture.valeur} />
        )}
      </section>
    </main>
  );
}

function Devis({ devis }: { devis: import("@/app/lib/souscription").Devis }) {
  const caduc = devis.etat === "CADUC" || devis.valide_jusqu_au < aujourdhui();
  // ⚠️ « À RÉGLER AUJOURD'HUI » SEULEMENT SI L'ON PEUT RÉGLER. Le devis l'affichait
  // en gros sur un tarif indicatif, juste au-dessus de la phrase qui disait qu'il
  // ne se réglait pas : le chiffre le plus visible de la page promettait l'inverse.
  const reglable = devis.complet && devis.prix_arretes;
  return (
    <>
      <div className="proforma__carte">
        <p className="proforma__surtitre">Devis {devis.reference}</p>
        <h1 className="proforma__titre">Votre devis</h1>
        <p className="proforma__texte">
          Établi le {dateCourte(devis.etabli_le.slice(0, 10))} pour {devis.prospect.prenom} {devis.prospect.nom}
          {devis.prospect.denomination ? `, ${devis.prospect.denomination}` : ""} · valable jusqu&rsquo;au{" "}
          {dateCourte(devis.valide_jusqu_au)}
        </p>
        <dl className="proforma__lignes proforma__detail">
          {devis.lignes.map((l) => (
            <div key={`${l.service}-${l.formule ?? ""}`} className="proforma__ligne">
              {/* ⚠️ LA CLÉ TECHNIQUE DE LA FORMULE NE S'IMPRIME PLUS.
                  Le devis annonçait « Impôt libératoire (liberatoire) » : le
                  libellé porte déjà la formule en toutes lettres, et la
                  parenthèse ajoutait la MÊME chose sous sa forme interne, sans
                  accent. Sur un document commercial que le client garde. */}
              <dt>
                {l.libelle}
                {/* ⚠️ L'UNITÉ N'A DE SENS QUE SANS MONTANT : sur une ligne « sur
                    étude », elle est la seule chose qui dise dans quelle unité
                    l'étude répondra. */}
                {!l.chiffree && l.precision ? ` · ${l.precision}` : ""}
              </dt>
              <dd>
                {l.chiffree && l.montant ? montantFcfa(l.montant) : "sur étude"}
                {l.periodicite === "MENSUELLE" ? " par mois" : l.periodicite === "ANNUELLE" ? " par an" : ""}
              </dd>
            </div>
          ))}
        </dl>
        <p className="proforma__texte proforma__detail">{reglable ? "À régler aujourd’hui" : "Tarif indicatif"}</p>
        <p className="proforma__montant">{montantFcfa(devis.montant_a_regler)}</p>
        {Number(devis.abonnement_mensuel) > 0 && (
          <p className="proforma__texte">
            Puis {montantFcfa(devis.abonnement_mensuel)} par mois, prélevés à chaque échéance.
          </p>
        )}
      </div>
      <div className="proforma__carte">
        {devis.etat === "ENGAGE" && devis.souscription ? (
          <p role="status">
            Vous vous êtes déjà engagé sur ce devis.{" "}
            <Link href={`/souscrire/suivi/${devis.souscription}`}>Suivre la souscription</Link>
          </p>
        ) : devis.etat === "ABANDONNE" ? (
          <p role="status">Ce devis a été abandonné. <Link href="/souscrire">Établir un nouveau devis</Link></p>
        ) : caduc ? (
          <p role="status">Ce devis n&rsquo;est plus valable. <Link href="/souscrire">Établir un nouveau devis</Link></p>
        ) : !devis.complet ? (
          <RappelDuDevis
            reference={devis.reference}
            telephone={devis.prospect.telephone}
            motif="Une partie de ce devis se chiffre sur étude : il ne se règle pas en ligne."
          />
        ) : !devis.prix_arretes ? (
          // ⚠️ LE PRIX EST UNE DÉCISION DU GÉRANT. Tant qu'il ne l'a pas arrêté, le
          // montant est indicatif et le backend refuse le paiement : on ne propose pas
          // un geste qui échouera au moment où le visiteur a décidé de payer.
          <RappelDuDevis
            reference={devis.reference}
            telephone={devis.prospect.telephone}
            motif="Ce tarif est indicatif : le cabinet le confirme avant tout paiement."
          />
        ) : (
          <EngagementDevis reference={devis.reference} montant={montantFcfa(devis.montant_a_regler)} />
        )}
      </div>
    </>
  );
}
