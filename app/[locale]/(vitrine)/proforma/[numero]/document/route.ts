/**
 * Le document de la proforma, servi à la cliente par le site.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN RELAIS, ET NON UN LIEN DIRECT VERS L'API
 *
 * Parce que **le navigateur n'a pas à connaître l'adresse du serveur**, et ne
 * la connaît pas : `app/lib/adresse-api.ts` explique pourquoi elle n'est pas
 * préfixée `NEXT_PUBLIC_`. Elle est interne au réseau, et c'est le serveur du
 * site qui appelle l'API.
 *
 * Un lien direct aurait donc marché sur le poste du développeur, où tout est sur
 * `localhost`, et aurait donné une page d'erreur à la cliente en production. Le
 * relais est la seule forme qui tienne dans les deux cas.
 *
 * ⚠️ LE SCEAU EST TRANSMIS TEL QUEL, ET RIEN N'EST VÉRIFIÉ ICI
 *
 * C'est l'API qui contrôle le sceau, sa version et son expiration, et elle seule.
 * Refaire ce contrôle ici donnerait deux gardes pour une seule règle : le jour où
 * l'une change, l'autre reste, et la plus permissive gagne. Le site ne fait que
 * porter la question.
 *
 * ⚠️ `inline` et non `attachment` : la cliente doit LIRE sa proposition avant de
 * l'accepter. Un téléchargement forcé mettrait un fichier entre elle et sa
 * décision.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ADRESSE_API } from "@/app/lib/adresse-api";

export async function GET(
  requete: Request,
  contexte: { params: Promise<{ numero: string }> },
) {
  const { numero } = await contexte.params;
  const entrant = new URL(requete.url).searchParams;
  // Les trois paramètres du lien signé, et eux seuls : recopier l'ensemble
  // laisserait passer n'importe quoi vers l'API.
  const sortant = new URLSearchParams();
  for (const cle of ["v", "e", "s"] as const) {
    const valeur = entrant.get(cle);
    if (!valeur) return new Response("Lien incomplet.", { status: 400 });
    sortant.set({ v: "version", e: "expire_le", s: "sceau" }[cle], valeur);
  }

  const reponse = await fetch(
    `${ADRESSE_API}/acquisition/proformas/${encodeURIComponent(numero)}/document?${sortant}`,
    // ⚠️ Jamais de cache : le document est nominatif, et un mandataire qui le
    // garderait le servirait à la requête suivante.
    { cache: "no-store" },
  );

  if (!reponse.ok) {
    // On ne recopie pas le message de l'API : il est écrit pour un journal, pas
    // pour une cliente. Le code, lui, est conservé tel quel.
    const message =
      reponse.status === 404
        ? "Aucun document n'est attaché à cette proposition."
        : "Ce lien n'est plus valable. Le cabinet peut vous en renvoyer un.";
    return new Response(message, {
      status: reponse.status,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(reponse.body, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="proforma-${numero}.pdf"`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
}
