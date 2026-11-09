import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { joindreUnePieceALaDemande, payerEnLigne, payerLesFraisDeTraitement } = await import("./actions-acquisition");

/**
 * Les pièces jointes à une demande (19 octobre 2026, point 22).
 *
 * ⚠️ Ce que ces cas gardent : le jeton part tel que l'accusé l'a rendu, rien d'autre
 * ne désigne la demande, et un refus du serveur est montré tel quel au visiteur.
 */

function doublerFetch(reponse: unknown = {}, statut = 201) {
  const doublure = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(reponse), {
      status: statut,
      headers: { "content-type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", doublure);
  return doublure;
}

function formulaire(jeton: string, fichier?: File): FormData {
  const f = new FormData();
  f.append("jeton", jeton);
  if (fichier) f.append("fichier", fichier);
  return f;
}

const BAIL = new File([new Uint8Array([37, 80, 68, 70])], "bail.pdf", { type: "application/pdf" });

beforeEach(() => vi.unstubAllGlobals());

describe("Joindre une pièce à sa demande", () => {
  it("envoie le jeton de l'accusé et le fichier, et le dit", async () => {
    const f = doublerFetch({ nom: "bail.pdf", taille: 4, pieces: 1 });
    const etat = await joindreUnePieceALaDemande({ echec: null, recues: [] }, formulaire("JETON", BAIL));
    expect(etat.echec).toBeNull();
    expect(etat.recues).toEqual(["« bail.pdf » est jointe à votre demande (1 pièce)."]);
    expect(String(f.mock.calls[0][0])).toContain("/acquisition/demandes/pieces");
    const corps = (f.mock.calls[0][1] as RequestInit).body as FormData;
    expect(corps.get("jeton")).toBe("JETON");
    expect(corps.get("fichier")).toBeInstanceOf(File);
  });

  it("garde ce qui est déjà parti quand l'envoi suivant échoue", async () => {
    doublerFetch({ detail: "Une demande porte au plus 5 pièces." }, 409);
    const etat = await joindreUnePieceALaDemande(
      { echec: null, recues: ["déjà là"] },
      formulaire("JETON", BAIL),
    );
    expect(etat.recues).toEqual(["déjà là"]);
    expect(etat.echec).toContain("5 pièces");
  });

  it("n'appelle pas le serveur sans fichier", async () => {
    const f = doublerFetch();
    const etat = await joindreUnePieceALaDemande({ echec: null, recues: [] }, formulaire("JETON"));
    expect(etat.echec).toContain("Choisissez");
    expect(f).not.toHaveBeenCalled();
  });
});


/** 9 novembre 2026 : les frais de traitement à l'envoi, et les tranches de la proforma. */
describe("Les versements du parcours", () => {
  const VIDE = { echec: null, fait: null, simule: false };
  const champs = (valeurs: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(valeurs)) f.append(k, v);
    return f;
  };

  it("demande le débit des frais par le seul jeton de l'accusé", async () => {
    const f = doublerFetch({ accepte: true, message: "ok", telephone: "…2233", simule: false }, 202);
    const etat = await payerLesFraisDeTraitement(VIDE, champs({ jeton: "JETON-FRAIS" }));
    expect(etat.echec).toBeNull();
    expect(String(f.mock.calls[0][0])).toContain("/acquisition/demandes/frais-de-traitement/paiement-en-ligne");
    expect(JSON.parse(String((f.mock.calls[0][1] as RequestInit).body))).toEqual({ jeton: "JETON-FRAIS", telephone: "" });
  });

  it("envoie le montant d'une tranche, et rien quand on règle tout le reste", async () => {
    const lien = { numero: "PRO-1", version: "1", expire_le: "2026-11-24T00:00:00", sceau: "S".repeat(32) };
    let f = doublerFetch({ accepte: true, message: "ok", telephone: "…2233", simule: false }, 202);
    await payerEnLigne(VIDE, champs({ ...lien, montant: "100 000" }));
    expect(JSON.parse(String((f.mock.calls[0][1] as RequestInit).body)).montant).toBe("100000");
    f = doublerFetch({ accepte: true, message: "ok", telephone: "…2233", simule: false }, 202);
    await payerEnLigne(VIDE, champs({ ...lien, montant: "" }));
    expect(JSON.parse(String((f.mock.calls[0][1] as RequestInit).body))).not.toHaveProperty("montant");
  });

  it("refuse un montant qui n'est pas en francs entiers, sans appeler le serveur", async () => {
    const f = doublerFetch();
    const etat = await payerEnLigne(VIDE, champs({ numero: "PRO-1", montant: "12,5" }));
    expect(etat.echec).toContain("francs");
    expect(f).not.toHaveBeenCalled();
  });
});

/** 9 novembre 2026 : le rendez-vous et le code de dossier partent avec la demande. */
describe("Le rendez-vous et le code de dossier", () => {
  it("transmet le créneau choisi et le code saisi, et rend ce que le serveur a fait", async () => {
    const { deposerUneDemande } = await import("./actions-acquisition");
    const f = doublerFetch({
      recue: true,
      canal_de_rappel: "APPEL",
      message: "ok",
      rattachee: true,
      frais_deja_verses: "25000",
      rendez_vous: { mode: "EN_LIGNE", debut: "2026-11-10T09:00:00", fin: "2026-11-10T10:00:00" },
    });
    const resultat = await deposerUneDemande({
      demarche: "CREATION",
      nom: "Ngono Couture",
      telephone: "699445566",
      courriel: "ngono@exemple.cm",
      message: "",
      consentementContact: true,
      origine: "vitrine-creation",
      rendezVous: { mode: "EN_LIGNE", debut: "2026-11-10T09:00:00" },
      codeDeDossier: " k7m4-q2xp ",
    });
    const corps = JSON.parse(String((f.mock.calls[0][1] as RequestInit).body));
    expect(corps.rendez_vous).toEqual({ mode: "EN_LIGNE", debut: "2026-11-10T09:00:00" });
    expect(corps.code_de_dossier).toBe("k7m4-q2xp");
    expect(resultat).toMatchObject({ enregistree: true, rattachee: true, fraisDejaVerses: "25000" });
  });
});
