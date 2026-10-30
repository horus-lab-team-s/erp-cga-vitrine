// ⚠️ ÉCRIT PAR outils/publier-apk.sh : ne pas modifier à la main.
// Les paquets Android servis par le site, avec ce qu'il faut pour vérifier un téléchargement.

export type RoleDuPaquet = "arm64" | "armv7" | "universel";

export const PAQUETS_ANDROID: readonly { fichier: string; role: RoleDuPaquet; octets: number; sha256: string }[] = [
  { fichier: "cga-brcg-arm64.apk", role: "arm64", octets: 20861186, sha256: "81f955730d944fd5338d12773dd6a7a1986d7be32d3de119825cda1a52202cdc" },
  { fichier: "cga-brcg-armv7.apk", role: "armv7", octets: 18688296, sha256: "88c1ed04366a5602b4ce54a1f9d6da2cf8aa857dd6330b879c0141aa850fcdaa" },
  { fichier: "cga-brcg.apk", role: "universel", octets: 58366213, sha256: "cad9366555aecc95d29f2ae7c5d09d0fee229e32473ccc1c2e8a1e414715026c" },
];
