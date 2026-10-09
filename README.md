# Vitrine CGA Broad Range

Le site public du centre de gestion agréé **Broad Range Consulting** : ce que le cabinet
propose, ce qu'il coûte, et par où l'on entre pour devenir adhérent.

Conception et réalisation : **TCHAMBA TCHAKOUNTE Edwin**, ingénieur informaticien.

## Ce que ce dépôt porte, et ce qu'il ne porte pas

| Ici | Ailleurs |
| --- | --- |
| Les pages publiques, le blog, l'estimateur de devis, le tunnel de souscription | La console du cabinet et l'espace adhérent : dépôt `erp-cga-console` |
| Les composants et les styles de la vitrine | Les routes qu'elle appelle : dépôt `erp-cga-backend` |
| Les catalogues de messages `commun`, `pages` et `vitrine` | Le contenu éditorial (articles, annonces, institutions), servi par le backend |

⚠️ **Le contenu éditorial n'est pas ici.** Les articles et les annonces vivent dans
`Contenu_vitrine/` du dépôt backend, qui les sert par son contexte L. Cette séparation est
voulue : le cabinet édite ce contenu sans toucher au site, et sa cible est une table en
base, pas un fichier de ce dépôt.

## Le noyau partagé avec la console, et ce qu'il coûte

Huit modules sont **communs** à ce dépôt et à `erp-cga-console` : le client HTTP, les
formats, la saisie, les préférences, la session et les gestes d'acquisition. À la scission,
la décision a été de les **recopier** plutôt que de les publier en paquet.

⚠️ **Le coût est connu et assumé : ces copies dérivent.** Le jour où le client HTTP change
d'un côté, rien ne le signale de l'autre. Deux garde-fous, et aucun n'est automatique :

1. toute correction du noyau se reporte dans les deux dépôts, dans la même journée ;
2. le fichier concerné porte en tête la mention du dépôt jumeau.

Le jour où cette discipline coûtera plus cher qu'un paquet publié, il faudra publier le
paquet. Ce jour-là se reconnaît à un symptôme : un défaut corrigé deux fois.

## Démarrer

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

L'adresse du backend se règle par variable d'environnement ; sans backend joignable, les
pages qui lisent du contenu rendent leur état vide plutôt que d'échouer.

## Vérifier

```bash
npx tsc --noEmit     # les types
npm run lint         # les conventions
npm test             # 86 cas, en moins de deux secondes
npm run build        # la compilation
```

⚠️ **Ce dépôt n'avait aucun test, et c'était le plus gros trou du projet.** Le serveur en
a 3 814, le téléphone 233 ; ici il n'y avait que `lint` et `build`. Une compilation
réussie dit « le code tient debout » : elle ne lit pas un montant, ne vérifie pas qu'une
image existe, ne refuse rien.

Ce que le banc garde en priorité, et pourquoi :

| Ce qui est gardé | Le défaut que ça empêche |
| --- | --- |
| `bareme-creation.ts` | Une majoration de capital comptée deux fois — l'écart ne se voit que sur les gros capitaux, c'est-à-dire là où il coûte le plus |
| `blog.ts` | Un `slug` en double qui rend un article inaccessible, une image citée qui n'existe pas sur le disque, un compteur de rubrique faux. Rien de tout cela ne fait échouer la compilation, et le plan du site publie l'adresse morte aux moteurs |
| `services-vitrine.ts` | Une fiche au `slug` dupliqué, publiée deux fois au plan du site ; une icône inconnue qui laisse une case vide en tête de fiche |
| `actions-souscription.ts` | Un NIU envoyé avec ses espaces, refusé par le backend, devant un prospect qui vient de remplir huit champs. Et des champs d'identité envoyés depuis la page, qui permettraient de déposer une demande au nom d'un tiers |
| `formats.ts` | Un montant absent affiché « 0 », donc « rien à payer », alors que la vérité est « on ne sait pas » |

⚠️ **Les cas ne remplacent pas un parcours réel dans un navigateur.** Une page peut être
juste ici et illisible à l'écran. Les deux sont nécessaires ; celui-ci est celui qui
tourne à chaque changement.

## Le parcours réel, dans un vrai navigateur

```bash
docker compose -p cga up -d     # la pile de démonstration
npm run essai-reel              # 8 parcours, en une trentaine de secondes
```

⚠️ **Séparé de `npm test`, et c'est voulu.** Un banc unitaire qui exigerait Docker ne
tournerait ni sur le poste d'un nouveau venu, ni dans la chaîne.

⚠️ **Il emploie le Chrome du poste**, pas celui que l'outil télécharge : 170 Mo en moins,
et surtout le navigateur que le cabinet emploie réellement. Un parcours qui passe sur un
Chromium d'outil et casse sur le Chrome du poste ne sert à rien.

⚠️ **Il n'écrit rien.** La vitrine dépose de VRAIES demandes commerciales : un parcours qui les enverrait créerait un prospect à chaque exécution, et le chargé de clientèle rappellerait un fantôme.

Ce qu'il attrape, et que les cas unitaires **ne peuvent pas voir** :

| Ce qui est attrapé | Pourquoi les cas unitaires ne le voient pas |
| --- | --- |
| L'hydratation de l'estimateur | `estimer()` est éprouvée sur 20 cas, mais rien ne dit que la page s'hydrate : un estimateur figé rend les mêmes chiffres quoi qu'on change, et paraît fonctionner |
| Le champ « capital » qu'on peut effacer | Le défaut du 11 août ne se voit que dans un navigateur : le champ réécrivait le minimum légal à chaque touche et devenait insaisissable |
| Les images réellement chargées | Les cas unitaires vérifient que le FICHIER existe ; celui-ci vérifie que le navigateur le CHARGE, y compris en bas de page |
| Dix pages publiques, titre et contenu visibles | Une page qui répond 200 et n'affiche rien fait partir le visiteur, et rien ne le signale |
| `robots.txt` et le plan du site servis | Ce sont des fichiers générés : leur code compile même quand la sortie est vide |

⚠️ **Un piège rencontré en l'écrivant** : `networkidle` n'est jamais atteint sur une page
à images paresseuses — le navigateur retient leur requête tant qu'on ne descend pas, et
l'attente expire sur une page parfaitement saine. L'optimiseur, lui, rend ces images en
4 ms. On descend donc la page, ce qui déclenche le chargement paresseux et le vérifie du
même coup.

