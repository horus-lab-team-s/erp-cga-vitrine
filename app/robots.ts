import type { MetadataRoute } from "next";

import { SITE_URL } from "@/app/lib/site";

/**
 * Ce que les moteurs ont le droit de parcourir.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ IL N'Y EN AVAIT AUCUN, ET CE N'EST PAS UN DÉTAIL DE RÉFÉRENCEMENT.
 *
 * Sans ce fichier, un moteur parcourt tout ce qu'il trouve — y compris les
 * adresses qu'on lui donne par erreur. Les pages privées portent déjà
 * `noindex`, mais cette balise se lit APRÈS le chargement de la page : le
 * moteur a déjà demandé la proforma d'un client, et son sceau a voyagé dans
 * les journaux d'un tiers. Ici, il s'arrête avant.
 *
 * ⚠️ CE QUI EST INTERDIT, ET POURQUOI
 *
 *   · `/proforma/`        une proposition chiffrée, nominative, scellée ;
 *   · `/souscrire/devis/` le devis d'un prospect, avec son prix ;
 *   · `/souscrire/suivi/` l'état d'une souscription, donc d'un paiement.
 *
 * Ces trois-là ne sont pas secrets — leur adresse est longue et non devinable,
 * c'est elle qui protège — mais ils n'ont rien à faire dans un index public.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/proforma/", "/souscrire/devis/", "/souscrire/suivi/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
