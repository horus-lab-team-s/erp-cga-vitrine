import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

/**
 * Chargement des messages pour le rendu serveur.
 *
 * Les catalogues sont découpés par domaine, `vitrine`, `pages` et `commun`, plutôt
 * qu'entassés dans un seul fichier : à quelques milliers de clés, un fichier unique
 * devient impossible à relire en revue et provoque des conflits à chaque fusion.
 *
 * ⚠️ Le catalogue `erp` a été retiré à la scission des dépôts : il nomme des écrans que
 * ce dépôt ne porte pas. Un fichier de messages qui décrit l'absent finit par être
 * traduit pour rien, et par masquer les clés qui manquent vraiment.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const demandee = await requestLocale;
  const locale = hasLocale(routing.locales, demandee) ? demandee : routing.defaultLocale;

  const [commun, vitrine, pages] = await Promise.all([
    import(`../messages/${locale}/commun.json`),
    import(`../messages/${locale}/vitrine.json`),
    import(`../messages/${locale}/pages.json`),
  ]);

  return {
    locale,
    messages: {
      commun: commun.default,
      vitrine: vitrine.default,
      pages: pages.default,
    },
  };
});
