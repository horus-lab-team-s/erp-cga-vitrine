import { beforeEach, describe, expect, it, vi } from "vitest";

const rediriger = vi.fn();
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: "jeton" }) }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({ getLocale: async () => "fr" }));
vi.mock("@/i18n/navigation", () => ({
  // Le vrai `redirect` interrompt l'exécution en levant ; la doublure aussi.
  redirect: (cible: unknown) => {
    rediriger(cible);
    throw new Error("REDIRECTION");
  },
}));

const {
  activerUneSouscription,
  demanderLeRappelDuDevis,
  etablirUnDevis,
  sEngagerSurLeDevis,
} = await import("./actions-souscription");

/**
 * Le parcours public de souscription.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CE PARCOURS EST OUVERT : PAS DE SESSION, PAS DE COLLABORATEUR DERRIÈRE.
 *
 * Un prospect saisit lui-même son NIU, son chiffre d'affaires, son téléphone.
 * Il les saisit comme on les écrit au Cameroun — avec des espaces, en
 * minuscules. Ce que ces cas gardent, c'est la **normalisation** : un NIU envoyé
 * avec ses espaces est refusé par le backend, et le prospect qui vient de
 * remplir huit champs voit une erreur qu'il ne comprend pas. Il s'en va.
 *
 * ⚠️ ET CE QUI NE DOIT PAS PARTIR DE LA PAGE. Sur le rappel d'un devis, seule
 * la RÉFÉRENCE est envoyée : le serveur reprend le nom et le courriel du devis
 * lui-même. Renvoyer ces champs depuis la page permettrait de déposer une
 * demande au nom de quelqu'un d'autre sous la référence d'un devis.
 * ─────────────────────────────────────────────────────────────────────────────
 */

function doublerFetch(reponse: unknown = {}, statut = 200) {
  const doublure = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(reponse), {
      status: statut,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", doublure);
  return doublure;
}

function formulaire(champs: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) f.append(k, v);
  return f;
}

function corps(f: ReturnType<typeof doublerFetch>) {
  return JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
}

const PROSPECT = {
  service: "adhesion",
  nom: "NKOA",
  prenom: "Jean-Paul",
  courriel: "jp.nkoa@batimentplus.cm",
  telephone: "+237676887686",
};
const VIDE = { echec: null, fait: null };

beforeEach(() => {
  vi.unstubAllGlobals();
  rediriger.mockReset();
});

describe("Établir un devis", () => {
  it("exige les cinq champs sans lesquels on ne peut rappeler personne", async () => {
    const f = doublerFetch();
    for (const manquant of ["service", "nom", "prenom", "courriel", "telephone"]) {
      const etat = await etablirUnDevis(VIDE, formulaire({ ...PROSPECT, [manquant]: "" }));
      expect(etat.echec, `sans ${manquant}`).toContain("obligatoires");
    }
    expect(f).not.toHaveBeenCalled();
  });

  it("ôte les espaces d'un NIU et le met en majuscules", async () => {
    const f = doublerFetch({ reference: "D-001" });
    // ⚠️ « M081 2345 6789 0P » est la façon dont on lit un NIU à voix haute et
    // dont on le recopie. Le NIU, lui, n'a pas d'espaces : envoyé tel quel, il
    // est refusé, et le prospect qui vient de remplir huit champs s'en va.
    await expect(
      etablirUnDevis(VIDE, formulaire({ ...PROSPECT, niu: "m081 2345 6789 0p" })),
    ).rejects.toThrow("REDIRECTION");
    expect(corps(f).prospect.niu).toBe("M081234567890P");
  });

  it("ôte les espaces d'un chiffre d'affaires saisi lisiblement", async () => {
    const f = doublerFetch({ reference: "D-001" });
    await expect(
      etablirUnDevis(VIDE, formulaire({ ...PROSPECT, chiffre_affaires: "28 000 000" })),
    ).rejects.toThrow("REDIRECTION");
    expect(corps(f).prospect.chiffre_affaires_declare).toBe("28000000");
  });

  it("envoie `null` et non une chaîne vide pour les champs facultatifs", async () => {
    const f = doublerFetch({ reference: "D-001" });
    await expect(etablirUnDevis(VIDE, formulaire(PROSPECT))).rejects.toThrow("REDIRECTION");
    const p = corps(f).prospect;
    // ⚠️ Une chaîne vide serait un NIU DÉCLARÉ, et faux. `null` dit « pas
    // communiqué », ce qui est la vérité et ce que le backend sait traiter.
    expect(p.niu).toBeNull();
    expect(p.denomination).toBeNull();
    expect(p.chiffre_affaires_declare).toBeNull();
  });

  it("mène le prospect à son devis", async () => {
    doublerFetch({ reference: "D-2026-0042" });
    await expect(etablirUnDevis(VIDE, formulaire(PROSPECT))).rejects.toThrow("REDIRECTION");
    expect(rediriger).toHaveBeenCalledWith({ href: "/souscrire/devis/D-2026-0042", locale: "fr" });
  });

  it("ne redirige pas quand le backend refuse, et montre son motif", async () => {
    doublerFetch({ detail: "Ce service n'est pas au catalogue." }, 422);
    const etat = await etablirUnDevis(VIDE, formulaire(PROSPECT));
    expect(etat.echec).toBe("Ce service n'est pas au catalogue.");
    expect(rediriger).not.toHaveBeenCalled();
  });
});

describe("S'engager sur un devis", () => {
  it("refuse sans la case cochée, sans rien engager", async () => {
    const f = doublerFetch();
    const etat = await sEngagerSurLeDevis(
      { echec: null, message: null, souscription: null },
      formulaire({ reference: "D-001", accord: "non" }),
    );
    expect(etat.echec).toContain("Cochez la case");
    // Un engagement est un contrat : il ne part pas sur un clic distrait.
    expect(f).not.toHaveBeenCalled();
  });

  it("rend la référence de la souscription créée", async () => {
    doublerFetch({ message: "Souscription enregistrée.", souscription: { reference: "S-2026-0007" } });
    const etat = await sEngagerSurLeDevis(
      { echec: null, message: null, souscription: null },
      formulaire({ reference: "D-001", accord: "oui" }),
    );
    expect(etat.souscription).toBe("S-2026-0007");
    expect(etat.echec).toBeNull();
  });

  it("échappe la référence dans l'adresse", async () => {
    const f = doublerFetch({ message: "", souscription: { reference: "S" } });
    await sEngagerSurLeDevis(
      { echec: null, message: null, souscription: null },
      formulaire({ reference: "../../admin", accord: "oui" }),
    );
    expect(String(f.mock.calls[0][0])).toContain("..%2F..%2Fadmin");
  });
});

describe("Demander à être rappelé sur un devis", () => {
  it("n'envoie QUE la référence", async () => {
    const f = doublerFetch({ message: "Nous vous rappelons sous 24 h." });
    const donnees = formulaire({ reference: "D-001" });
    // Le formulaire pourrait porter d'autres champs ; ils ne doivent pas partir.
    donnees.append("courriel", "attaquant@example.cm");
    donnees.append("nom", "QUELQU'UN D'AUTRE");

    await demanderLeRappelDuDevis(VIDE, donnees);

    // ⚠️ Le serveur reprend le nom et le courriel DU DEVIS. Laisser la page les
    // fournir permettrait de déposer une demande au nom d'un tiers sous la
    // référence de son devis.
    expect(corps(f)).toEqual({});
  });

  it("refuse sans devis désigné", async () => {
    const f = doublerFetch();
    const etat = await demanderLeRappelDuDevis(VIDE, formulaire({ reference: "" }));
    expect(etat.echec).toBe("Devis non désigné.");
    expect(f).not.toHaveBeenCalled();
  });

  it("rend le message du serveur, qui dit le délai", async () => {
    doublerFetch({ message: "Un chargé de clientèle vous rappelle sous 24 heures ouvrées." });
    const etat = await demanderLeRappelDuDevis(VIDE, formulaire({ reference: "D-001" }));
    expect(etat.fait).toContain("24 heures");
  });
});

describe("Ouvrir l'accès d'un souscripteur", () => {
  const complet = {
    reference: "S-2026-0007",
    verification: "CNI présentée au guichet le 25/09, photo comparée au dossier.",
    confirmation: "oui",
  };

  it("exige la case cochée, en disant ce qu'elle donne", async () => {
    const f = doublerFetch();
    const etat = await activerUneSouscription(VIDE, formulaire({ ...complet, confirmation: "non" }));
    // ⚠️ Ouvrir l'accès donne la LECTURE DU DOSSIER à cette personne. La case
    // dit exactement cela, et non « confirmez-vous ? ».
    expect(etat.echec).toContain("lecture du dossier");
    expect(f).not.toHaveBeenCalled();
  });

  it("exige que la vérification d'identité soit décrite", async () => {
    const f = doublerFetch();
    const etat = await activerUneSouscription(VIDE, formulaire({ ...complet, verification: "vu" }));
    // ⚠️ Le backend refuse aussi, mais avec « String should have at least 20
    // characters » — de l'anglais de schéma, devant un collaborateur qui vient
    // d'ouvrir un accès. Le seuil reste celui du backend ; l'écran le dit en
    // français, et dit QUOI écrire.
    expect(etat.echec).toContain("pièces présentées, par qui, quand");
    expect(f).not.toHaveBeenCalled();
  });

  it("nomme la personne à qui l'accès vient d'être ouvert", async () => {
    doublerFetch({ prospect: { courriel: "jp.nkoa@batimentplus.cm" } });
    const etat = await activerUneSouscription(VIDE, formulaire(complet));
    // Un « c'est fait » sans destinataire laisse le doute sur QUI a reçu
    // l'accès — précisément ce qu'on vient de vérifier.
    expect(etat.fait).toContain("jp.nkoa@batimentplus.cm");
    expect(etat.fait).toContain("lien d'activation");
  });
});
