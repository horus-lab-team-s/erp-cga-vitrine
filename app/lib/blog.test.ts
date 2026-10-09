import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ARTICLES,
  articleParSlug,
  articlesDeLaRubrique,
  articlesTries,
  articlesVoisins,
  comptesParRubrique,
  RUBRIQUES,
} from "./blog";

/**
 * Le blog : l'ordre, les rubriques, et ce que personne ne relit.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE FICHIER GARDE DU CONTENU, PAS DU CODE, ET C'EST VOULU.
 *
 * Les articles sont écrits à la main dans `blog.ts`. Une faute de frappe dans un
 * `slug`, une rubrique inventée, une image qui n'existe pas : rien de tout cela
 * ne fait échouer la compilation, et rien ne se voit en relecture — on relit le
 * texte, pas les chemins.
 *
 * Ce qu'on découvre alors, c'est en production : un article introuvable, une
 * vignette cassée dans le sommaire, un compteur de rubrique faux. Et le plan du
 * site, construit depuis cette même liste, publie l'adresse morte aux moteurs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

describe("L'intégrité de la liste", () => {
  it("n'a aucun identifiant d'adresse en double", () => {
    // ⚠️ Deux articles au même `slug` : le second est INACCESSIBLE, puisque
    // `articleParSlug` rend le premier trouvé. Il reste pourtant au sommaire,
    // et son lien mène à l'autre article.
    const slugs = ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("n'emploie que des identifiants utilisables dans une adresse", () => {
    for (const article of ARTICLES) {
      // Minuscules, chiffres et tirets : un accent ou une espace se retrouve
      // encodé dans l'adresse, illisible et impossible à dicter au téléphone.
      expect(article.slug, `article « ${article.titre} »`).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("range chaque article dans une rubrique qui existe", () => {
    for (const article of ARTICLES) {
      // Une rubrique inventée fait disparaître l'article du filtre sans que
      // rien ne le signale.
      expect(RUBRIQUES, `article « ${article.titre} »`).toContain(article.rubrique);
    }
  });

  it("date chaque article d'une date réelle", () => {
    for (const article of ARTICLES) {
      expect(article.date, `article « ${article.titre} »`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(article.date)), `article « ${article.titre} »`).toBe(false);
    }
  });

  it("annonce une durée de lecture plausible", () => {
    for (const article of ARTICLES) {
      // Zéro minute ferait afficher « 0 min de lecture » sous le titre.
      expect(article.minutes, `article « ${article.titre} »`).toBeGreaterThan(0);
      expect(article.minutes, `article « ${article.titre} »`).toBeLessThan(60);
    }
  });

  it("donne à chaque article une accroche, un résumé et un corps", () => {
    for (const article of ARTICLES) {
      expect(article.accroche.trim(), `article « ${article.titre} »`).not.toBe("");
      expect(article.resume.trim(), `article « ${article.titre} »`).not.toBe("");
      expect(article.corps.length, `article « ${article.titre} »`).toBeGreaterThan(0);
    }
  });

  it("cite des images qui existent vraiment sur le disque", () => {
    // ⚠️ LE CONTRÔLE QU'AUCUNE RELECTURE NE FAIT. Un chemin d'image faux se
    // compile, se déploie, et ne se voit qu'à l'écran — souvent après la mise
    // en ligne, parce que les vignettes du sommaire sont en bas de page.
    for (const article of ARTICLES) {
      expect(article.image, `article « ${article.titre} »`).toMatch(/^\//);
      const surLeDisque = join(process.cwd(), "public", article.image);
      expect(existsSync(surLeDisque), `image absente : ${article.image}`).toBe(true);
    }
  });
});

describe("L'ordre de publication", () => {
  it("met le plus récent en tête", () => {
    const tries = articlesTries();
    for (let i = 1; i < tries.length; i += 1) {
      expect(tries[i - 1].date >= tries[i].date).toBe(true);
    }
  });

  it("ne perd ni ne duplique aucun article en triant", () => {
    expect(articlesTries()).toHaveLength(ARTICLES.length);
  });

  it("ne réordonne pas la liste d'origine", () => {
    // ⚠️ `sort` trie EN PLACE. Sans la copie, le premier appel réordonnerait
    // `ARTICLES` pour tout le reste du processus — un défaut qui se manifeste
    // dans un autre écran que celui qui l'a causé.
    const avant = ARTICLES.map((a) => a.slug);
    articlesTries();
    expect(ARTICLES.map((a) => a.slug)).toEqual(avant);
  });
});

describe("La recherche et le filtre", () => {
  it("retrouve un article par son identifiant", () => {
    const attendu = ARTICLES[0];
    expect(articleParSlug(attendu.slug)?.titre).toBe(attendu.titre);
  });

  it("rend `undefined` sur un identifiant inconnu, sans lever", () => {
    // La page d'article s'en sert pour rendre un 404 propre.
    expect(articleParSlug("cet-article-n-existe-pas")).toBeUndefined();
  });

  it("rend tout le blog quand aucune rubrique n'est choisie", () => {
    expect(articlesDeLaRubrique(null)).toHaveLength(ARTICLES.length);
  });

  it("ne rend que la rubrique demandée", () => {
    for (const rubrique of RUBRIQUES) {
      for (const article of articlesDeLaRubrique(rubrique)) {
        expect(article.rubrique).toBe(rubrique);
      }
    }
  });

  it("compte par rubrique sans rien oublier", () => {
    const comptes = comptesParRubrique();
    // Le total doit retomber sur le nombre d'articles : un écart voudrait dire
    // qu'une rubrique n'est pas comptée, et sa pastille afficherait zéro.
    expect(Object.values(comptes).reduce((s, n) => s + n, 0)).toBe(ARTICLES.length);
    for (const rubrique of RUBRIQUES) {
      expect(comptes[rubrique]).toBe(articlesDeLaRubrique(rubrique).length);
    }
  });
});

describe("Les articles proposés au bas d'un article", () => {
  it("ne proposent jamais l'article qu'on est en train de lire", () => {
    for (const article of ARTICLES) {
      const voisins = articlesVoisins(article);
      expect(voisins.map((v) => v.slug), `article « ${article.titre} »`).not.toContain(
        article.slug,
      );
    }
  });

  it("commencent par la même rubrique", () => {
    const article = ARTICLES.find(
      (a) => ARTICLES.filter((b) => b.rubrique === a.rubrique).length > 1,
    );
    if (!article) return; // aucune rubrique n'a deux articles : rien à vérifier
    // Un lecteur venu pour du juridique en veut d'autre.
    expect(articlesVoisins(article)[0].rubrique).toBe(article.rubrique);
  });

  it("complètent avec les plus récents quand la rubrique est maigre", () => {
    for (const article of ARTICLES) {
      const voisins = articlesVoisins(article, 3);
      // Trois propositions tant qu'il reste trois articles : un bas de page à
      // une seule vignette paraît inachevé.
      expect(voisins.length, `article « ${article.titre} »`).toBe(
        Math.min(3, ARTICLES.length - 1),
      );
    }
  });

  it("respectent le nombre demandé", () => {
    expect(articlesVoisins(ARTICLES[0], 1)).toHaveLength(1);
    expect(articlesVoisins(ARTICLES[0], 0)).toHaveLength(0);
  });
});
