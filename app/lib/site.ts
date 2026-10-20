/**
 * L'adresse publique du site.
 *
 * Elle sert aux métadonnées de partage : une vignette Facebook ou WhatsApp exige
 * des adresses **absolues**. Un chemin relatif est simplement ignoré, et le lien
 * partagé apparaît nu, sans titre ni image — c'est-à-dire sans raison d'être
 * cliqué.
 *
 * `NEXT_PUBLIC_SITE_URL` permet de pointer une préproduction sans toucher au
 * code ; à défaut, le domaine de production. Jamais de barre oblique finale : les
 * chemins qu'on y accroche commencent par la leur.
 */
export const SITE_URL = (
  // `||` et non `??` : une image construite sans l'argument porte une chaîne vide.
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.cga-brcgroup.com"
).replace(/\/$/, "");

/** `/blog/mon-article` → `https://www.cga-brcgroup.com/fr/blog/mon-article`. */
export function adresseAbsolue(chemin: string): string {
  return `${SITE_URL}${chemin.startsWith("/") ? chemin : `/${chemin}`}`;
}

/**
 * L'adresse publique d'une page dans une langue (20 octobre 2026, audit du référencement).
 *
 * ⚠️ Le français, langue par défaut, n'a PAS de préfixe (`localePrefix: "as-needed"`) :
 * `/fr/contact` redirige vers `/contact`. Annoncer aux moteurs une adresse qui redirige
 * leur fait indexer la redirection, ou rien.
 */
export function adressePublique(langue: string, chemin: string): string {
  const suite = chemin === "/" ? "" : chemin;
  return langue === "fr" ? `${SITE_URL}${suite || "/"}` : `${SITE_URL}/${langue}${suite}`;
}

/**
 * L'adresse canonique de la page, et ses équivalents dans l'autre langue.
 *
 * Sans eux, la page française et la page anglaise passent pour deux pages en
 * concurrence, et le moteur n'en garde qu'une, pas toujours la bonne.
 */
export function alternatives(langue: string, chemin: string) {
  return {
    canonical: adressePublique(langue, chemin),
    languages: {
      fr: adressePublique("fr", chemin),
      en: adressePublique("en", chemin),
      "x-default": adressePublique("fr", chemin),
    },
  };
}
