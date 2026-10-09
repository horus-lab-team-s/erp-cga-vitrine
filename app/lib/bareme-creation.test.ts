import { describe, expect, it } from "vitest";

import {
  DOMICILIATION,
  estimer,
  FORMES,
  type FormeJuridique,
  VILLES,
  VILLES_GUICHET,
} from "./bareme-creation";

/**
 * L'estimateur de création d'entreprise.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE QUE CES CAS GARDENT, ET CE QU'ILS NE GARDENT PAS
 *
 * Ils gardent le CALCUL : la majoration de capital sur la bonne ligne, les
 * associés au-delà du minimum, le délai allongé hors guichet unique. Ils ne
 * disent RIEN de la justesse des montants eux-mêmes : ce sont des frais
 * officiels datés, ils changent, et leur place est au référentiel normatif —
 * l'en-tête du barème le dit, et cet écart reste ouvert.
 *
 * Un chiffre faux au barème est une erreur de saisie que le cabinet corrige. Un
 * calcul faux est une erreur que personne ne voit : le total paraît plausible,
 * le client paie, et l'écart se découvre à la proforma réelle.
 * ─────────────────────────────────────────────────────────────────────────────
 */

function forme(code: string): FormeJuridique {
  const trouvee = FORMES.find((f) => f.code === code);
  if (!trouvee) throw new Error(`forme inconnue : ${code}`);
  return trouvee;
}

/** Une estimation « au plus simple » : rien qui majore. */
function estimationNue(code: string, ajustements: Partial<Parameters<typeof estimer>[0]> = {}) {
  const f = forme(code);
  return estimer({
    forme: f,
    capital: f.capitalReference,
    associes: f.associesMin,
    ville: "Douala",
    domiciliation: false,
    ...ajustements,
  });
}

describe("La structure du barème", () => {
  it("porte la majoration sur une ligne et une seule, là où il y a un capital", () => {
    // ⚠️ LA MAJORATION DE CAPITAL S'AJOUTE À CHAQUE LIGNE MARQUÉE. Deux lignes
    // majorables la compteraient DEUX FOIS, et l'écart ne se verrait que sur
    // les gros capitaux — c'est-à-dire sur les dossiers où il coûte le plus.
    //
    // ⚠️ Et une forme SANS capital n'en porte aucune : l'établissement n'a pas
    // de capital social, donc rien à majorer. Exiger une ligne partout
    // obligerait à en inventer une chez lui.
    for (const f of FORMES) {
      const majorables = f.lignes.filter((l) => l.majorable).length;
      expect(majorables, `forme ${f.code}`).toBe(f.capitalReference > 0 ? 1 : 0);
    }
  });

  it("donne à chaque forme un capital minimum au plus égal à sa référence", () => {
    // Une référence inférieure au minimum légal ferait majorer dès le premier
    // franc, sur un capital que la loi impose.
    for (const f of FORMES) {
      expect(f.capitalReference, `forme ${f.code}`).toBeGreaterThanOrEqual(
        f.code === "ETS" ? 0 : f.capitalMin,
      );
    }
  });

  it("comprend la SA, qui avait été supposée absente à tort", () => {
    expect(FORMES.map((f) => f.code)).toContain("SA");
    expect(forme("SA").capitalMin).toBe(10_000_000);
  });

  it("n'a aucun code en double", () => {
    const codes = FORMES.map((f) => f.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("place les deux villes à guichet unique dans la liste des villes", () => {
    // Une ville de guichet absente de la liste serait inatteignable au
    // formulaire : le délai court ne s'appliquerait jamais.
    for (const ville of VILLES_GUICHET) expect(VILLES).toContain(ville);
  });
});

describe("La majoration liée au capital", () => {
  it("ne s'applique pas au capital de référence", () => {
    expect(estimationNue("SARL").majorationCapital).toBe(0);
  });

  it("porte sur le seul excédent, à quatre pour mille", () => {
    // 5 000 000 − 1 000 000 = 4 000 000 · 0,4 % = 16 000
    expect(estimationNue("SARL", { capital: 5_000_000 }).majorationCapital).toBe(16_000);
  });

  it("s'arrondit aux 500 FCFA les plus proches", () => {
    // Les droits ne se liquident pas au franc près.
    // 1 100 000 − 1 000 000 = 100 000 · 0,4 % = 400 → 500
    expect(estimationNue("SARL", { capital: 1_100_000 }).majorationCapital).toBe(500);
  });

  it("ne descend jamais sous zéro sur un capital inférieur à la référence", () => {
    // Un capital en dessous de la référence ferait une majoration NÉGATIVE,
    // c'est-à-dire une remise involontaire sur les frais officiels.
    expect(estimationNue("SARL", { capital: 100_000 }).majorationCapital).toBe(0);
  });

  it("ne s'applique pas à l'établissement, qui n'a pas de capital", () => {
    expect(estimationNue("ETS", { capital: 50_000_000 }).majorationCapital).toBe(0);
  });

  it("s'ajoute à la ligne d'enregistrement, et à elle seule", () => {
    const nu = estimationNue("SARL");
    const majore = estimationNue("SARL", { capital: 5_000_000 });

    const ligneNue = nu.detailOfficiels.find((l) => l.cle === "enregistrement");
    const ligneMajoree = majore.detailOfficiels.find((l) => l.cle === "enregistrement");
    expect(ligneMajoree!.montant - ligneNue!.montant).toBe(16_000);

    // Les autres lignes ne bougent pas d'un franc.
    for (const ligne of majore.detailOfficiels.filter((l) => l.cle !== "enregistrement")) {
      const avant = nu.detailOfficiels.find((l) => l.cle === ligne.cle)!;
      expect(ligne.montant, `ligne ${ligne.cle}`).toBe(avant.montant);
    }
  });
});

describe("Les associés", () => {
  it("ne majorent rien au minimum de la forme", () => {
    expect(estimationNue("SARL", { associes: 2 }).majorationAssocies).toBe(0);
  });

  it("se comptent au-delà du minimum, pas au-delà de un", () => {
    // ⚠️ Une SARL commence à DEUX associés. Compter à partir de un ferait
    // facturer un associé supplémentaire à tout le monde.
    expect(estimationNue("SARL", { associes: 5 }).majorationAssocies).toBe(3 * 15_000);
  });

  it("comptent à partir de un pour la forme unipersonnelle", () => {
    expect(estimationNue("SARLU", { associes: 1 }).majorationAssocies).toBe(0);
  });
});

describe("Le délai annoncé", () => {
  it("est celui de la forme dans les villes à guichet unique", () => {
    expect(estimationNue("SARL", { ville: "Douala" }).semaines).toBe(forme("SARL").semaines);
    expect(estimationNue("SARL", { ville: "Yaoundé" }).semaines).toBe(forme("SARL").semaines);
  });

  it("gagne deux semaines ailleurs", () => {
    // Le dossier voyage jusqu'au guichet. C'est la réalité du terrain, et
    // l'annoncer évite un appel mécontent à la sixième semaine.
    expect(estimationNue("SARL", { ville: "Bafoussam" }).semaines).toBe(
      forme("SARL").semaines + 2,
    );
  });
});

describe("Le total et sa composition", () => {
  it("sépare ce qui va à l'État de ce qui va au cabinet", () => {
    const e = estimationNue("SARL");
    const f = forme("SARL");

    expect(e.totalOfficiels).toBe(f.lignes.reduce((s, l) => s + l.montant, 0));
    expect(e.totalHonoraires).toBe(f.honoraires);
    expect(e.total).toBe(e.totalOfficiels + e.totalHonoraires);
    // ⚠️ La part officielle est L'ARGUMENT de la page : le client découvre que
    // l'essentiel de la facture n'est pas l'honoraire du cabinet.
    expect(e.partOfficiels).toBeGreaterThan(50);
  });

  it("range la domiciliation dans les honoraires, pas dans les frais officiels", () => {
    const sans = estimationNue("SARL");
    const avec = estimationNue("SARL", { domiciliation: true });

    // C'est une prestation du cabinet. La compter en frais officiels ferait
    // croire à une taxe.
    expect(avec.totalOfficiels).toBe(sans.totalOfficiels);
    expect(avec.totalHonoraires - sans.totalHonoraires).toBe(DOMICILIATION);
    expect(avec.domiciliation).toBe(DOMICILIATION);
  });

  it("reste cohérent sur une SA à gros capital, avec associés et domiciliation", () => {
    const e = estimationNue("SA", {
      capital: 50_000_000,
      associes: 4,
      ville: "Garoua",
      domiciliation: true,
    });
    const f = forme("SA");

    // 50 M − 10 M = 40 M · 0,4 % = 160 000
    expect(e.majorationCapital).toBe(160_000);
    expect(e.majorationAssocies).toBe(2 * 15_000);
    expect(e.totalOfficiels).toBe(f.lignes.reduce((s, l) => s + l.montant, 0) + 160_000);
    expect(e.totalHonoraires).toBe(f.honoraires + 30_000 + DOMICILIATION);
    expect(e.total).toBe(e.totalOfficiels + e.totalHonoraires);
    expect(e.semaines).toBe(f.semaines + 2);
  });

  it("ne rend jamais une part officielle absurde", () => {
    for (const f of FORMES) {
      const e = estimationNue(f.code);
      expect(e.partOfficiels, `forme ${f.code}`).toBeGreaterThan(0);
      expect(e.partOfficiels, `forme ${f.code}`).toBeLessThanOrEqual(100);
    }
  });
});
