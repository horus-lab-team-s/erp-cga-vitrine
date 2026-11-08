// ⚠️ ÉCRIT PAR outils/publier-apk.sh : ne pas modifier à la main.
// Les paquets Android servis par le site, avec ce qu'il faut pour vérifier un téléchargement.

export type RoleDuPaquet = "arm64" | "armv7" | "universel";

export const PAQUETS_ANDROID: readonly { fichier: string; role: RoleDuPaquet; octets: number; sha256: string }[] = [
  { fichier: "cga-brcg-arm64.apk", role: "arm64", octets: 20861186, sha256: "9adbb274c14becb276e2624fd0ce2dbdb8b2586d9499610471bb730dd519ef05" },
  { fichier: "cga-brcg-armv7.apk", role: "armv7", octets: 18688300, sha256: "dfe9a0e1165d96ef5d3d4873e39d1313f78edb2a8575172e92655b40e9b8d829" },
  { fichier: "cga-brcg.apk", role: "universel", octets: 58366217, sha256: "dc2c2efb5a82f22d9fb86a39055ff3e1ebda6ebc7c1adb6fed15d61bb1af6d84" },
];
