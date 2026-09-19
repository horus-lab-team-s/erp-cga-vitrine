/**
 * L'adresse du serveur, dite une seule fois.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ IL Y EN AVAIT DEUX, ET L'UNE N'ÉTAIT JAMAIS POSÉE
 *
 * `api.ts` lisait `API_URL`, que la pile de démonstration et l'image de
 * production renseignent toutes deux. `contenu-vitrine.ts` lisait
 * `NEXT_PUBLIC_API_URL`, que personne ne renseignait nulle part.
 *
 * Conséquence : le contenu éditorial du site — articles, annonces, institutions
 * — venait **toujours** du secours, jamais du serveur, y compris quand celui-ci
 * tournait à côté. Les pages répondaient 200 et paraissaient normales : c'est
 * tout l'objet du secours, et c'est ce qui a caché le défaut. Il a fallu lire le
 * journal d'une construction sur Vercel, où le serveur est absent pour de bon,
 * pour que la ligne « passage au secours » saute aux yeux.
 *
 * ⚠️ ET SURTOUT : PAS DE `NEXT_PUBLIC_`.
 *
 * Ce préfixe fait **inscrire la valeur dans le paquet envoyé au navigateur**, à
 * la construction. Deux effets, tous deux fâcheux : l'adresse du serveur est
 * publiée à qui veut la lire, et elle est figée — la changer demande de
 * reconstruire le site, alors qu'une variable ordinaire se relit à chaque
 * démarrage. Cette adresse est interne au réseau : personne dans le navigateur
 * n'a à la connaître, puisque c'est le serveur du site qui appelle l'API.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Sans barre oblique finale : les chemins qui s'y ajoutent commencent par « / ». */
export const ADRESSE_API = (process.env.API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
