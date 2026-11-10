#!/usr/bin/env bash
# Déposer les paquets Android du CGA dans le site, et en tenir la liste (30 octobre 2026).
#
#     outils/publier-apk.sh            # depuis la racine de ce dépôt, après le build mobile :
#
#     cd ../erp-cga-mobile && flutter build apk --release --split-per-abi \
#       --dart-define=CGA_API=https://api.cga-brcg.horus-lab.com \
#       --dart-define=CGA_VITRINE=https://cga-brcg.horus-lab.com
#
# POURQUOI TROIS PAQUETS. L'APK universel porte les trois architectures : 56 Mo. Sur une
# connexion mobile camerounaise, un téléchargement de cette taille se coupe, reprend mal, et
# Android refuse alors le fichier : « App not installed as package appears to be invalid ».
# C'est arrivé le 30 octobre 2026 (un fichier de la bonne taille, au contenu abîmé). Un
# téléphone n'a besoin que de SON architecture : 19 à 21 Mo.
#
# ⚠️ NUMÉROS DE VERSION. `--split-per-abi` donne 1001 (armv7), 2001 (arm64), 4001 (x86_64)
# pour la version 1.0.0+1, l'universel garde 1. Un téléphone passé à un paquet découpé refuse
# ensuite un universel plus « ancien » : publier toujours les deux familles ensemble, depuis
# le même build.
#
# Le script écrit `app/lib/paquets-android.ts` : tailles et empreintes SHA-256 affichées sur la
# page « Application », pour que l'adhérent puisse vérifier son fichier.
set -euo pipefail
ICI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SORTIE="${SORTIE:-$ICI/../erp-cga-mobile/build/app/outputs/flutter-apk}"
CIBLE="$ICI/public/telechargements"
mkdir -p "$CIBLE"

# fichier publié : source dans le build : rôle
PAQUETS=(
  "cga-brcg-arm64.apk:app-arm64-v8a-release.apk:arm64"
  "cga-brcg-armv7.apk:app-armeabi-v7a-release.apk:armv7"
  "cga-brcg.apk:app-release.apk:universel"
)

{
  echo "// ⚠️ ÉCRIT PAR outils/publier-apk.sh : ne pas modifier à la main."
  echo "// Les paquets Android servis par le site, avec ce qu'il faut pour vérifier un téléchargement."
  echo
  echo "export type RoleDuPaquet = \"arm64\" | \"armv7\" | \"universel\";"
  echo
  echo "export const PAQUETS_ANDROID: readonly { fichier: string; role: RoleDuPaquet; octets: number; sha256: string }[] = ["
  for p in "${PAQUETS[@]}"; do
    IFS=: read -r publie source role <<<"$p"
    [ -f "$SORTIE/$source" ] || { echo "Manque $SORTIE/$source : lancer d'abord le build mobile." >&2; exit 1; }
    cp "$SORTIE/$source" "$CIBLE/$publie"
    octets=$(stat -c %s "$CIBLE/$publie")
    empreinte=$(sha256sum "$CIBLE/$publie" | cut -d' ' -f1)
    echo "  { fichier: \"$publie\", role: \"$role\", octets: $octets, sha256: \"$empreinte\" },"
    echo "  $publie  $((octets / 1048576)) Mo  $empreinte" >&2
  done
  echo "];"
} > "$ICI/app/lib/paquets-android.ts.nouveau"
mv "$ICI/app/lib/paquets-android.ts.nouveau" "$ICI/app/lib/paquets-android.ts"
