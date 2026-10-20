import { render, screen } from "@testing-library/react";
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
});
