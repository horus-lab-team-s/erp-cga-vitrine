import { notFound } from "next/navigation";

/**
 * La route qui attrape tout ce qu'aucune autre ne sert.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ POURQUOI UNE ROUTE, ET NON UN SIMPLE `not-found.tsx`
 *
 * Le gabarit racine de cette application est `app/[locale]/layout.tsx` : c'est lui
 * qui rend `<html>` et `<body>`. Une adresse inconnue ne correspond à aucun
 * segment, Next ne peut donc entrer dans aucun gabarit, et il sert sa page par
 * défaut — « 404: This page could not be found. », en anglais, sans marque, sur
 * un site francophone. C'est ce que le visiteur voyait.
 *
 * Next 16 offre bien `app/global-not-found.tsx` pour ce cas, mais derrière le
 * drapeau expérimental `globalNotFound`, désactivé par défaut. On n'active pas un
 * drapeau expérimental sur un produit qu'un cabinet met entre les mains de ses
 * adhérents.
 *
 * Une route attrape-tout n'a rien d'expérimental. Elle correspond à n'importe
 * quelle adresse, entre donc dans la coquille du site, et appelle `notFound()` :
 * le visiteur reçoit la page d'erreur AVEC l'en-tête, le pied et la navigation,
 * ce qui lui donne un chemin de sortie au lieu d'une impasse.
 *
 * ⚠️ Elle ne masque aucune page réelle : Next donne toujours la priorité aux
 * segments statiques sur les segments attrape-tout, quel que soit l'ordre des
 * fichiers.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function Introuvable() {
  notFound();
}
