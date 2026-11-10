import { act, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import messages from "@/messages/fr/pages.json";

// La navigation localisée de next-intl ne se charge pas hors de Next : un lien suffit.
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...reste }: { href: string } & Record<string, unknown>) => <a href={href} {...reste} />,
}));

/** Le module lit le lien à son chargement : chaque cas le recharge, variable posée. */
async function rendre(lien: string | undefined) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_LIEN_APPLICATION_ANDROID", lien ?? "");
  const { BoutonDeTelechargement } = await import("./TelechargementApplication");
  render(
    <NextIntlClientProvider locale="fr" messages={{ pages: messages }}>
      <BoutonDeTelechargement />
    </NextIntlClientProvider>,
  );
}

afterEach(() => vi.unstubAllEnvs());

describe("le téléchargement de l'application", () => {
  it("annonce « bientôt » tant que le lien n'est pas posé, sans bouton", async () => {
    await rendre(undefined);
    expect(screen.getByRole("status").textContent).toContain("Bientôt disponible");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("mène à la fiche Google Play quand elle est posée", async () => {
    const play = "https://play.google.com/store/apps/details?id=cm.cgabrcg.cga_mobile";
    await rendre(play);
    const lien = screen.getByRole("link", { name: /Google Play/ });
    expect(lien.getAttribute("href")).toBe(play);
    expect(screen.getByText(/Android 7 ou plus récent/)).toBeTruthy();
  });

  it("ignore un lien en clair : rien ne se télécharge hors https", async () => {
    await rendre("http://www.cga-brcgroup.com/cga.apk");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("propose les paquets du site : l'universel d'abord, les autres avec taille et empreinte", async () => {
    await rendre("https://cga-brcg.horus-lab.com/telechargements/cga-brcg.apk");
    const bouton = screen.getByRole("link", { name: /Télécharger pour Android/ });
    // Le rendu serveur (et tout navigateur muet) : le paquet qui s'installe partout.
    expect(bouton.getAttribute("href")).toBe("https://cga-brcg.horus-lab.com/telechargements/cga-brcg.apk");
    expect(screen.getByRole("link", { name: /Téléphone récent/ }).getAttribute("href"))
      .toBe("https://cga-brcg.horus-lab.com/telechargements/cga-brcg-arm64.apk");
    expect(screen.getByRole("link", { name: /entrée de gamme/ }).getAttribute("href"))
      .toBe("https://cga-brcg.horus-lab.com/telechargements/cga-brcg-armv7.apk");
    expect(screen.getAllByText(/^SHA-256 [0-9a-f]{64}$/)).toHaveLength(3);
    expect(screen.getByText(/paquet non valide/)).toBeTruthy();
  });

  it("sur un Android 64 bits, le bouton mène au paquet léger", async () => {
    vi.stubGlobal("navigator", { ...navigator, userAgentData: { getHighEntropyValues: async () => ({ bitness: "64", platform: "Android" }) } });
    // La réponse du navigateur arrive après le rendu : on la laisse se poser dans act().
    await act(async () => rendre("https://cga-brcg.horus-lab.com/telechargements/cga-brcg.apk"));
    const bouton = screen.getByRole("link", { name: /Télécharger pour Android/ });
    await waitFor(() => expect(bouton.getAttribute("data-paquet")).toBe("arm64"));
    expect(bouton.getAttribute("href")).toMatch(/cga-brcg-arm64\.apk$/);
    vi.unstubAllGlobals();
  });

  it("un lien vers un autre fichier reste tel quel, sans adresses inventées", async () => {
    await rendre("https://www.cga-brcgroup.com/app/cga.apk");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});

describe("le choix du paquet", () => {
  it("64 bits → arm64, 32 bits → armv7, inconnu ou ordinateur → universel", async () => {
    const { choisirLePaquet } = await import("./ChoixDuPaquet");
    expect(choisirLePaquet("64", "Android")).toBe("arm64");
    expect(choisirLePaquet("32", "Android")).toBe("armv7");
    expect(choisirLePaquet(undefined, "Android")).toBe("universel");
    expect(choisirLePaquet("64", "Windows")).toBe("universel");
  });
});
