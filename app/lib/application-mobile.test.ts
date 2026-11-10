import { describe, expect, it } from "vitest";

import { estGooglePlay, lienDeLApplication } from "./application-mobile";

describe("le lien de l'application mobile", () => {
  it("n'existe pas tant qu'il n'est pas posé", () => {
    expect(lienDeLApplication(undefined)).toBeNull();
    expect(lienDeLApplication("  ")).toBeNull();
  });

  it("refuse le clair et ce qui n'est pas une adresse", () => {
    expect(lienDeLApplication("http://www.cga-brcgroup.com/cga.apk")).toBeNull();
    expect(lienDeLApplication("cga.apk")).toBeNull();
  });

  it("garde une adresse sûre, fiche Google Play ou fichier du cabinet", () => {
    const play = "https://play.google.com/store/apps/details?id=cm.cgabrcg.cga_mobile";
    expect(lienDeLApplication(play)).toBe(play);
    expect(estGooglePlay(play)).toBe(true);
    const apk = "https://www.cga-brcgroup.com/telechargements/cga.apk";
    expect(lienDeLApplication(apk)).toBe(apk);
    expect(estGooglePlay(apk)).toBe(false);
  });
});
