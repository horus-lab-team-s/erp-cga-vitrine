"""Chaque lien INTERNE de chaque page publique, suivi pour de bon.

⚠️ Sur les attributs `href`, et rien d'autre. Un premier essai filtrait les
chemins sur leur forme et prenait « /images/services/creation-entreprise.jpg »
pour un lien vers un service : cinq faux liens morts annoncés, tous inventés par
l'outil. Une mesure qui se trompe est pire qu'une mesure absente.
"""
import re, urllib.request, urllib.error, collections

import os
BASE = os.environ.get("CGA_ADRESSE_VITRINE", "http://localhost:3101")
DEPART = ["/", "/le-cabinet", "/devenir-adherent", "/formations", "/estimation",
          "/creer-mon-entreprise", "/blog", "/contact", "/souscrire",
          "/mentions-legales", "/conditions-generales", "/confidentialite"]
HREF = re.compile(r'href="(/[^"#]*)"')
#: Ce qui n'est pas une page : actifs servis, et non navigués.
ACTIF = re.compile(r"\.(jpg|jpeg|png|svg|webp|ico|css|js|json|txt|xml|pdf|woff2?)$", re.I)

def lire(chemin):
    try:
        with urllib.request.urlopen(BASE + chemin, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception:
        return 0, ""

liens = collections.defaultdict(set)   # cible -> pages qui la citent
for page in DEPART:
    _, corps = lire(page)
    for cible in HREF.findall(corps):
        cible = cible.split("?")[0].rstrip("/") or "/"
        if not ACTIF.search(cible) and not cible.startswith("/_next"):
            liens[cible].add(page)

morts = []
for cible in sorted(liens):
    code, _ = lire(cible)
    if code != 200:
        morts.append((cible, code, sorted(liens[cible])))

print(f"{len(liens)} adresses internes citées · {len(morts)} cassée(s)\n")
for cible, code, depuis in morts:
    print(f"  ⚠️  {cible}  → HTTP {code}")
    print(f"      citée depuis : {', '.join(depuis)}")
if not morts:
    print("  aucun lien mort")
