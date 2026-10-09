import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEMARCHES, cleDeLaDemarche } from "./acquisition";

/**
 * Chaque démarche du catalogue a-t-elle un libellé, dans les deux langues ?
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 *
 * Le 29 septembre, l'accueil de la vitrine émettait ceci à chaque affichage :
 *
 *     MISSING_MESSAGE: vitrine.formulaire.demarches.CREATION (fr)
 *
 * Les codes du catalogue sont en majuscules, les clés de traduction en
 * minuscules. Quatre endroits composaient la clé à la main ; trois
 * minusculaient, un l'avait oublié. Ce que le visiteur en voyait : le message
 * WhatsApp préparé pour le cabinet portait « Démarche : demarches.CREATION » au
 * lieu du libellé.
 *
 * ⚠️ **CE QUI A LAISSÉ PASSER LE DÉFAUT EST AUSSI IMPORTANT QUE LE DÉFAUT.**
 *
 * Le parcours navigateur l'a trouvé en une seconde : il refuse toute erreur de
 * console sur une page publique. Mais les parcours navigateur ne tournent PAS en
 * intégration continue — ils demandent une pile allumée. Le défaut a donc vécu
 * deux jours dans un dépôt dont la chaîne était verte.
 *
 * Ce fichier-ci tourne, lui, à chaque intégration : il n'a besoin d'aucune pile,
 * seulement des fichiers de traduction. Il ne remplace pas le parcours navigateur
 * et ne prétend pas le faire ; il ferme la porte par laquelle celui-là est entré.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const LANGUES = ["fr", "en"] as const;

function libelles(langue: string): Record<string, string> {
  const brut = readFileSync(
    join(process.cwd(), "messages", langue, "vitrine.json"),
    "utf8",
  );
  return JSON.parse(brut).formulaire?.demarches ?? {};
}

describe("Les démarches du catalogue et leurs libellés", () => {
  it("compose une clé en minuscules, quel que soit le code reçu", () => {
    expect(cleDeLaDemarche("CREATION")).toBe("demarches.creation");
    expect(cleDeLaDemarche("creation")).toBe("demarches.creation");
  });

  for (const langue of LANGUES) {
    it(`donne un libellé à chacune des ${DEMARCHES.length} démarches en ${langue}`, () => {
      const disponibles = libelles(langue);
      // ⚠️ On passe par `cleDeLaDemarche`, et non par un `.toLowerCase()` écrit
      // ici : si la fonction se trompe, ce cas doit tomber avec l'application.
      // Un test qui recompose la clé de son côté vérifierait sa propre copie.
      const manquantes = DEMARCHES.filter((code) => {
        const cle = cleDeLaDemarche(code).replace("demarches.", "");
        return !disponibles[cle];
      });
      expect(manquantes, `libellés absents en ${langue}`).toEqual([]);
    });
  }

  it("n'a aucun libellé orphelin, que plus personne n'affiche", () => {
    // ⚠️ La contre-épreuve. Sans elle, retirer une démarche du catalogue
    // laisserait son libellé derrière, et le fichier de traduction deviendrait
    // un cimetière que personne n'ose plus nettoyer.
    const attendues = DEMARCHES.map((c) => cleDeLaDemarche(c).replace("demarches.", ""));
    for (const langue of LANGUES) {
      const orphelins = Object.keys(libelles(langue)).filter((c) => !attendues.includes(c));
      expect(orphelins, `libellés sans démarche en ${langue}`).toEqual([]);
    }
  });
});
