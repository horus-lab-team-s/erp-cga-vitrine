import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEMARCHES } from "./acquisition";
import { ICONES_VITRINE } from "./icones-vitrine";
import {
  ENTREES_NAV,
  ficheParSlug,
  FICHES_SERVICE,
  FORMES_JURIDIQUES,
  lienForme,
  SERVICES_VITRINE,
} from "./services-vitrine";

/**
 * Le catalogue de services, et ce qu'il entraîne derrière lui.
 *
 * ⚠️ CES LISTES ALIMENTENT LE PLAN DU SITE. `sitemap.ts` construit une adresse
 * par fiche : un `slug` en double publie deux fois la même page aux moteurs, qui
 * n'en garderont qu'une et compteront l'autre comme un doublon. Une fiche
 * ajoutée à la liste entre au plan sans que personne n'y pense — c'est voulu, et
 * c'est ce qui rend l'intégrité de la liste importante.
 */

function surLeDisque(chemin: string): boolean {
  return existsSync(join(process.cwd(), "public", chemin));
}

describe("Les fiches de service", () => {
  it("n'ont aucun identifiant d'adresse en double", () => {
    const slugs = FICHES_SERVICE.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("n'emploient que des identifiants utilisables dans une adresse", () => {
    for (const fiche of FICHES_SERVICE) {
      expect(fiche.slug, `fiche ${fiche.cle}`).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("citent une icône qui existe", () => {
    // Une icône inconnue rend une case vide en tête de fiche, et le titre
    // paraît décalé sans qu'on comprenne pourquoi.
    for (const fiche of FICHES_SERVICE) {
      expect(Object.keys(ICONES_VITRINE), `fiche ${fiche.slug}`).toContain(fiche.icone);
    }
  });

  it("citent des images qui existent vraiment sur le disque", () => {
    for (const fiche of FICHES_SERVICE) {
      for (const image of fiche.images) {
        expect(image, `fiche ${fiche.slug}`).toMatch(/^\//);
        expect(surLeDisque(image), `image absente : ${image}`).toBe(true);
      }
    }
  });

  /**
   * ⚠️ CE QUI A COÛTÉ LE PLUS CHER : UNE FICHE QUI NE DÉPOSE RIEN.
   *
   * Mesuré le 6 octobre 2026 : une seule page du site déposait réellement une
   * demande, la page Contact. Les fiches de service ouvraient un courriel, et un
   * prospect qui l'envoyait n'apparaissait nulle part — ni dans les demandes
   * entrantes, ni dans l'affectation, ni dans la veille des dossiers en
   * souffrance. Il existait tant que quelqu'un se souvenait de lui.
   *
   * Depuis, chaque fiche porte le code du catalogue sous lequel sa demande entre.
   * Ces deux cas interdisent qu'une fiche reparte sans, ou avec un code que la
   * porte d'acquisition refuserait.
   */
  it("portent toutes une démarche", () => {
    for (const fiche of FICHES_SERVICE) {
      expect(fiche.demarche, `fiche ${fiche.slug}`).toBeTruthy();
    }
  });

  it("n'emploient que des démarches que la porte d'acquisition admet", () => {
    // ⚠️ Le backend refuse en 422 tout code absent de son catalogue, et il a
    // raison : un dossier né d'un code inconnu n'a ni questionnaire, ni
    // chiffrage, ni proforma, et il ne se voit pas — il ressemble à un dossier
    // qui attend.
    for (const fiche of FICHES_SERVICE) {
      expect(DEMARCHES, `fiche ${fiche.slug}`).toContain(fiche.demarche);
    }
  });

  it("se retrouvent par leur identifiant, et rendent `undefined` sinon", () => {
    expect(ficheParSlug(FICHES_SERVICE[0].slug)?.cle).toBe(FICHES_SERVICE[0].cle);
    expect(ficheParSlug("cette-fiche-n-existe-pas")).toBeUndefined();
  });
});

describe("Les services présentés sur l'accueil", () => {
  it("citent une icône qui existe", () => {
    for (const service of SERVICES_VITRINE) {
      expect(Object.keys(ICONES_VITRINE), `service ${service.icone}`).toContain(service.icone);
    }
  });

  it("citent des images qui existent vraiment sur le disque", () => {
    for (const service of SERVICES_VITRINE) {
      expect(surLeDisque(service.image), `image absente : ${service.image}`).toBe(true);
    }
  });
});

describe("Les formes juridiques et leurs liens", () => {
  it("mènent à une adresse interne, jamais vers un site tiers", () => {
    for (const forme of FORMES_JURIDIQUES) {
      const lien = lienForme(forme);
      const cible = typeof lien === "string" ? lien : String((lien as { href?: string }).href ?? lien);
      expect(cible, `forme ${JSON.stringify(forme)}`).toMatch(/^\//);
    }
  });
});

describe("Les entrées de navigation", () => {
  it("citent une icône qui existe", () => {
    for (const entree of ENTREES_NAV) {
      if ("icone" in entree && entree.icone) {
        expect(Object.keys(ICONES_VITRINE)).toContain(entree.icone);
      }
    }
  });

  it("n'ont aucune adresse en double", () => {
    // Deux entrées de menu vers la même page : le repère visuel de « page
    // courante » s'allume à deux endroits.
    const cibles = ENTREES_NAV.map((e) => JSON.stringify(e));
    expect(new Set(cibles).size).toBe(cibles.length);
  });
});
