import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { joindreUnePieceALaDemande } = await import("./actions-acquisition");

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
