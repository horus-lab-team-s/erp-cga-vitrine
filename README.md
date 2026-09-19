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
