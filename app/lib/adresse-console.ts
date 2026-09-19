/**
 * Où vit l'espace de travail.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ « ESPACE CLIENT » RENVOYAIT UN 404, SUR LES DOUZE PAGES DU SITE.
 *
 * C'est le bouton le plus à droite de l'en-tête, présent partout, et c'est par
 * lui que passe tout adhérent qui revient. Du temps du monodépôt, une seule
 * application servait le site public et la connexion : « /connexion » menait
 * quelque part. Depuis la scission, la connexion vit dans la console, et le
 * lien relatif désigne une page de la vitrine qui n'existe pas.
 *
 * Le symétrique existe côté console, où l'en-tête pointait sur des pages de la
 * vitrine : `adresse-vitrine.ts`. Une scission coupe les liens DANS LES DEUX
 * SENS, et n'en corriger qu'un donne l'illusion d'avoir fini.
 *
 * ⚠️ `NEXT_PUBLIC_` est ici légitime : c'est un lien que le navigateur doit
 * suivre, donc une adresse publique par nature. Rien n'est révélé qui ne figure
 * déjà dans la barre d'adresse.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const ADRESSE_CONSOLE =
  process.env.NEXT_PUBLIC_ADRESSE_CONSOLE ?? "http://localhost:3000";

/** L'adresse complète de la page de connexion. */
export const ADRESSE_CONNEXION = `${ADRESSE_CONSOLE.replace(/\/$/, "")}/connexion`;
