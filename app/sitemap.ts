import type { MetadataRoute } from "next";

import { articlesTries } from "@/app/lib/blog";
import { FICHES_SERVICE } from "@/app/lib/services-vitrine";
import { SITE_URL } from "@/app/lib/site";
import { routing } from "@/i18n/routing";

/**
 * Le plan du site : ce que le cabinet veut voir indexé, et rien d'autre.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ IL N'Y EN AVAIT AUCUN. Un moteur finit par trouver les pages d'un site
 * actif, mais il les trouve dans le désordre et à son rythme — un article publié
 * un lundi peut attendre trois semaines. Le plan les lui donne d'un coup.
 *
 * ⚠️ IL SE CONSTRUIT DEPUIS LES MÊMES SOURCES QUE LES PAGES, jamais d'une liste
 * recopiée. Un article ajouté au blog, une fiche de service ajoutée au
 * catalogue, entrent ici sans que personne n'y pense. Une liste à la main
 * diverge au premier ajout, et le jour où l'on s'en aperçoit l'article est resté
 * six mois invisible.
 *
 * ⚠️ LES PAGES PRIVÉES N'Y SONT PAS — proforma, devis, suivi. Elles portent
 * `noindex`, `robots.ts` les interdit, et elles n'ont pas d'adresse publique :
 * les inscrire ici reviendrait à publier ce qu'on protège.
 *
 * ⚠️ CHAQUE ADRESSE EST DONNÉE DANS LES DEUX LANGUES, avec ses alternatives.
 * Sans cela, un moteur qui trouve la version française et la version anglaise
 * les compte comme deux pages en concurrence, et n'en garde qu'une.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();

  /** Les pages fixes, avec l'importance que le cabinet leur donne. */
  const pages: { chemin: string; priorite: number; frequence: "weekly" | "monthly" | "yearly" }[] = [
    { chemin: "", priorite: 1, frequence: "weekly" },
    { chemin: "/creer-mon-entreprise", priorite: 0.9, frequence: "monthly" },
    { chemin: "/devenir-adherent", priorite: 0.9, frequence: "monthly" },
    { chemin: "/formations", priorite: 0.7, frequence: "monthly" },
    { chemin: "/estimation", priorite: 0.7, frequence: "monthly" },
    { chemin: "/souscrire", priorite: 0.8, frequence: "monthly" },
    { chemin: "/le-cabinet", priorite: 0.6, frequence: "monthly" },
    { chemin: "/contact", priorite: 0.6, frequence: "monthly" },
    { chemin: "/blog", priorite: 0.8, frequence: "weekly" },
    // Les mentions et conditions : rarement lues, jamais absentes.
    { chemin: "/mentions-legales", priorite: 0.2, frequence: "yearly" },
    { chemin: "/confidentialite", priorite: 0.2, frequence: "yearly" },
    { chemin: "/conditions-generales", priorite: 0.2, frequence: "yearly" },
    ...FICHES_SERVICE.map((fiche) => ({
      chemin: `/services/${fiche.slug}`,
      priorite: 0.8,
      frequence: "monthly" as const,
    })),
    ...articlesTries().map((article) => ({
      chemin: `/blog/${article.slug}`,
      priorite: 0.6,
      frequence: "monthly" as const,
    })),
  ];

  return pages.map(({ chemin, priorite, frequence }) => ({
    url: `${SITE_URL}/${routing.defaultLocale}${chemin}`,
    lastModified: maintenant,
    changeFrequency: frequence,
    priority: priorite,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((langue) => [langue, `${SITE_URL}/${langue}${chemin}`]),
      ),
    },
  }));
}
