"""Passe en revue chaque page publique, et dit ce qui ne va pas.

⚠️ Ce que cet outil trouve, un coup d'œil ne le trouve pas : une clé de
traduction non résolue se lit comme un mot étrange ; une image sans texte de
remplacement ne se voit pas du tout ; un titre dupliqué ne se voit qu'en
comparant deux pages.
"""
import re, sys, urllib.request, urllib.error, html as htmlmod

import os
BASE = os.environ.get("CGA_ADRESSE_VITRINE", "http://localhost:3101")
PAGES = [
    "/", "/le-cabinet", "/devenir-adherent", "/formations", "/estimation",
    "/creer-mon-entreprise", "/blog", "/contact", "/souscrire",
    "/mentions-legales", "/conditions-generales", "/confidentialite",
    "/services/prestations-ponctuelles", "/services/domiciliation",
    "/services/assistance-juridique", "/services/conseil-et-audit",
    "/blog/a-qui-s-applique-l-igs",
]

#: Une clé de traduction qui n'a pas été résolue : « vitrine.nav.services ».
CLE = re.compile(r"\b(?:vitrine|pages|commun|erp)\.[a-zA-Z][\w.]{3,}")
IMG = re.compile(r"<img\b[^>]*>", re.I)
TITRE = re.compile(r"<title>(.*?)</title>", re.S)

def texte_visible(h: str) -> str:
    h = re.sub(r"<script.*?</script>|<style.*?</style>", " ", h, flags=re.S | re.I)
    return htmlmod.unescape(re.sub(r"<[^>]+>", " ", h))

titres, soucis = {}, []
for chemin in PAGES:
    try:
        with urllib.request.urlopen(BASE + chemin, timeout=30) as r:
            code, brut = r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        soucis.append((chemin, "ÉTAT", f"HTTP {e.code}"))
        continue
    except Exception as e:  # noqa: BLE001
        soucis.append((chemin, "ÉTAT", f"injoignable : {e}"))
        continue

    visible = texte_visible(brut)
    for cle in sorted(set(CLE.findall(visible)))[:4]:
        soucis.append((chemin, "CLÉ NON RÉSOLUE", cle))

    sans_alt = [i for i in IMG.findall(brut) if not re.search(r'\balt\s*=', i, re.I)]
    if sans_alt:
        soucis.append((chemin, "IMAGE SANS TEXTE", f"{len(sans_alt)} balise(s)"))

    m = TITRE.search(brut)
    titre = m.group(1).strip() if m else ""
    if not titre:
        soucis.append((chemin, "TITRE", "absent"))
    else:
        titres.setdefault(titre, []).append(chemin)

    if not re.search(r'<meta\s+name="description"', brut, re.I):
        soucis.append((chemin, "DESCRIPTION", "absente"))

    if "�" in visible:
        soucis.append((chemin, "ENCODAGE", "caractère de remplacement dans le texte"))

    h1 = re.findall(r"<h1\b", brut, re.I)
    if len(h1) != 1:
        soucis.append((chemin, "TITRE DE PAGE", f"{len(h1)} balise(s) h1"))

for titre, chemins in titres.items():
    if len(chemins) > 1:
        soucis.append((", ".join(chemins), "TITRE DUPLIQUÉ", titre[:60]))

print(f"{len(PAGES)} pages visitées · {len(soucis)} constat(s)\n")
largeur = max((len(c) for c, _, _ in soucis), default=10)
for chemin, genre, detail in soucis:
    print(f"  {chemin:<{largeur}}  {genre:<18} {detail}")
