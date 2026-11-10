"use client";

import { useEffect, useState } from "react";

import type { RoleDuPaquet } from "@/app/lib/paquets-android";

export type Paquet = { role: RoleDuPaquet; href: string; mo: number; sha256: string };

/**
 * Le bon paquet pour CE téléphone (30 octobre 2026).
 *
 * Chrome pour Android dit si le système est en 64 ou 32 bits (`userAgentData`). En 64 bits :
 * le paquet arm64, 20 Mo ; en 32 bits — beaucoup de téléphones d'entrée de gamme, même à
 * processeur 64 bits — le paquet armv7. Sans réponse (autre navigateur, ordinateur) : le
 * paquet universel, plus lourd mais qui s'installe partout.
 *
 * ⚠️ Le rendu serveur propose l'universel : un choix faux (arm64 sur un système 32 bits)
 * donnerait un « paquet non valide » aussi obscur que celui qu'on cherche à éviter.
 */
export function choisirLePaquet(bits: string | undefined, plateforme: string | undefined): RoleDuPaquet {
  if (plateforme && plateforme.toLowerCase() !== "android") return "universel";
  if (bits === "64") return "arm64";
  if (bits === "32") return "armv7";
  return "universel";
}

type DonneesNavigateur = { getHighEntropyValues?: (cles: string[]) => Promise<{ bitness?: string; platform?: string }> };

export function ChoixDuPaquet({ paquets, libelle, taille, children }: { paquets: Paquet[]; libelle: string; taille: string; children?: React.ReactNode }) {
  const [role, setRole] = useState<RoleDuPaquet>("universel");
  useEffect(() => {
    const donnees = (navigator as Navigator & { userAgentData?: DonneesNavigateur }).userAgentData;
    donnees?.getHighEntropyValues?.(["bitness"])
      .then((v) => setRole(choisirLePaquet(v.bitness, v.platform)))
      .catch(() => undefined);
  }, []);
  const paquet = paquets.find((p) => p.role === role) ?? paquets.find((p) => p.role === "universel")!;
  return (
    <a className="bouton bouton--principal bouton--large" href={paquet.href} rel="noopener" data-paquet={paquet.role}>
      {children}
      {libelle} <span className="application__taille">{taille.replace("{mo}", String(paquet.mo))}</span>
    </a>
  );
}
