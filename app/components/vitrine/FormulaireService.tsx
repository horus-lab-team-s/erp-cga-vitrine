"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { deposerUneDemande } from "@/app/lib/actions-acquisition";
import type { Demarche, QuestionAuVisiteur, ResultatDemande } from "@/app/lib/acquisition";

import { IconeVitrine } from "./IconeVitrine";

/**
 * Le formulaire de demande, commun à tous les services.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN SEUL FORMULAIRE POUR TOUS LES SERVICES
 *
 * Parce qu'un visiteur qui vient de lire une fiche a une seule chose en tête :
 * demander **ce service-là**. Le renvoyer vers une page Contact générique, où il
 * doit re-choisir dans une liste ce qu'il vient de passer trois minutes à lire,
 * c'est lui faire refaire un travail déjà fait — et c'est là qu'on perd les
 * demandes.
 *
 * Le service est donc **pré-rempli et affiché**, pas caché dans un champ
 * masqué : le visiteur doit voir que la demande part sur le bon sujet. Il reste
 * modifiable, parce qu'on se trompe de page et qu'il serait absurde de renvoyer
 * quelqu'un en arrière pour cela.
 *
 * `sujetInitial` porte le libellé exact — « Domiciliation commerciale », mais
 * aussi bien « Formation : clôture et DSF » ou « Formule Sérénité ». Le même
 * composant sert donc les fiches de service, la page Formations et la page
 * Adhérent, chacune passant son propre intitulé.
 *
 * ⚠️ COMMENT LA DEMANDE PART, AUJOURD'HUI
 *
 * Elle compose un message et ouvre le client de messagerie du visiteur, à
 * destination du cabinet. **Ce n'est pas un envoi serveur** : le visiteur doit
 * appuyer sur « Envoyer » dans son application de courriel.
 *
 * C'est un choix assumé faute de mieux, et non un oubli. Un envoi réellement
 * automatique suppose un point d'entrée côté FastAPI **et des identifiants
 * SMTP** que le cabinet n'a pas encore fournis. Entre-temps, deux options : ce
 * `mailto`, où la demande part vraiment, ou un formulaire qui affiche « merci,
 * c'est envoyé » alors que la saisie est jetée en silence. La seconde est pire.
 *
 * Le bouton WhatsApp est là pour la même raison, et il est même le plus utilisé
 * : une part importante de la clientèle n'ouvre jamais de courriel.
 *
 * ⚠️ Ce jour est arrivé le 6 octobre 2026. La note disait « le jour où
 * `POST /vitrine/demandes` existera, seule la fonction `envoyer` change » : la
 * porte existait depuis longtemps sous le nom `POST /acquisition/demandes`, et
 * personne n'avait rebranché ce formulaire dessus. Voir la propriété `demarche`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Boîte de réception du cabinet. */
const DESTINATAIRE = "contact@cga-brcgroup.com";

export function FormulaireService({
  sujetInitial,
  demarche,
  numeroWhatsapp,
  formes,
  formeInitiale,
  questions = [],
}: {
  /** Le service, la session ou la formule dont on part. Modifiable ensuite. */
  sujetInitial: string;
  /**
   * Le **code du catalogue** sous lequel la demande entre dans le système.
   *
   * ───────────────────────────────────────────────────────────────────────────
   * ⚠️ SANS LUI, LA DEMANDE N'EXISTE QUE DANS UNE BOÎTE AUX LETTRES.
   *
   * Ce formulaire n'ouvrait qu'un courriel. Mesuré le 6 octobre 2026 : **une
   * seule page du site déposait réellement une demande**, la page Contact. Les
   * fiches de service, « Créer mon entreprise » et « Devenir adhérent » — les
   * deux parcours phares — s'arrêtaient au brouillon de message.
   *
   * Un prospect qui envoie ce courriel n'apparaît donc nulle part : ni dans les
   * demandes entrantes, ni dans l'affectation automatique, ni dans la veille des
   * dossiers en souffrance. Il existe tant que quelqu'un se souvient de lui.
   *
   * ⚠️ Le code est celui du CATALOGUE, pas le titre de la fiche. La porte
   * d'acquisition refuse tout ce qu'elle ne connaît pas, et elle a raison : un
   * dossier né d'un code inconnu n'a ni questionnaire, ni chiffrage, ni proforma.
   *
   * ⚠️ Le courriel et WhatsApp RESTENT. L'enregistrement part en parallèle, sans
   * rien retirer au client : beaucoup écrivent depuis leur téléphone, et leur
   * fermer ce canal pour gagner une ligne en base serait le perdre.
   * ───────────────────────────────────────────────────────────────────────────
   */
  demarche: Demarche;
  /** Numéro du cabinet, chiffres seuls. */
  numeroWhatsapp: string;
  /**
   * Les formes juridiques à proposer, si le service en demande une.
   *
   * Absent partout ailleurs, et c'est voulu : demander « SARL ou SAS ? » à qui
   * veut une domiciliation ou une formation n'a pas de sens, et un champ qui ne
   * concerne pas le lecteur est un champ qu'il remplit au hasard.
   */
  formes?: readonly string[];
  /** Code pré-sélectionné — celui du lien d'où l'on vient. */
  formeInitiale?: string;
  /**
   * Les questions du projet, lues au référentiel du cabinet. Toutes facultatives.
   *
   * ⚠️ Quand elles portent la forme juridique, le champ `formes` ci-dessus
   * s'efface : la même question posée deux fois sur le même écran donnerait deux
   * réponses, et c'est exactement la double saisie que ces questions suppriment.
   */
  questions?: readonly QuestionAuVisiteur[];
}) {
  const t = useTranslations("vitrine.demande");
  /* Les libellés viennent de l'estimateur : « SARL unipersonnelle », « Société
     anonyme ». Un seul jeu de noms pour les deux écrans, sinon la forme choisie
     ici ne se reconnaît plus dans le devis. */
  const nomsFormes = useTranslations("pages.estimation.formes");

  const [sujet, setSujet] = useState(sujetInitial);
  /* Une forme inconnue au barème est ignorée : l'adresse est modifiable à la
     main, et mieux vaut un champ vide qu'une valeur inventée. */
  const [forme, setForme] = useState(
    formeInitiale && formes?.includes(formeInitiale) ? formeInitiale : "",
  );
  const demandeLaForme = questions.some((q) => q.code === "forme_juridique");
  const [declarations, setDeclarations] = useState<Record<string, string>>(() => {
    const laForme = questions.find((q) => q.code === "forme_juridique");
    // La forme du lien d'où l'on vient, si le cabinet la propose sous ce code.
    const depart: Record<string, string> = {};
    if (laForme && formeInitiale && laForme.valeurs.some((v) => v.valeur === formeInitiale)) {
      depart.forme_juridique = formeInitiale;
    }
    return depart;
  });
  const declarer = (code: string, valeur: string) =>
    setDeclarations((avant) => ({ ...avant, [code]: valeur }));
  /** La réponse telle que le visiteur la relira : le nom d'un choix, pas son code. */
  const reponseLisible = (question: QuestionAuVisiteur) => {
    const brute = (declarations[question.code] ?? "").trim();
    if (!brute) return null;
    if (question.type === "BOOLEEN") return brute === "oui" ? t("oui") : t("non");
    return question.valeurs.find((v) => v.valeur === brute)?.libelle ?? brute;
  };
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [courriel, setCourriel] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [accordWhatsapp, setAccordWhatsapp] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [resultat, setResultat] = useState<ResultatDemande | "en-cours" | null>(null);

  /** Le corps du message, identique par courriel et par WhatsApp. */
  function corps() {
    return [
      t("corpsIntro", { sujet }),
      "",
      `${t("champNom")} : ${nom}`,
      `${t("champTelephone")} : ${telephone}`,
      courriel ? `${t("champCourriel")} : ${courriel}` : null,
      forme && !demandeLaForme ? `${t("champForme")} : ${nomsFormes(forme)}` : null,
      // Les réponses du projet partent aussi par courriel et par WhatsApp : un
      // visiteur qui choisit ces canaux ne doit pas les avoir remplies pour rien.
      ...questions.map((q) => {
        const reponse = reponseLisible(q);
        return reponse ? `${q.libelle} ${reponse}` : null;
      }),
      message ? `\n${t("champMessage")} :\n${message}` : null,
    ]
      .filter((ligne) => ligne !== null)
      .join("\n");
  }

  /**
   * Dépose la demande au cabinet, sans jamais bloquer le canal choisi.
   *
   * ⚠️ Un échec d'enregistrement ne doit **pas** empêcher le courriel ou le
   * message WhatsApp de partir. Le client a fait son geste ; lui refuser l'envoi
   * parce que notre API n'a pas répondu serait lui faire payer notre panne.
   * L'écran dit ce qui s'est passé, et le cabinet reçoit le message de toute
   * façon.
   */
  function enregistrer() {
    if (resultat === "en-cours") return;
    setResultat("en-cours");
    deposerUneDemande({
      demarche,
      nom,
      telephone,
      courriel,
      // Le sujet est repris dans le message : c'est lui qui dit ce que le
      // visiteur a demandé, là où le code du catalogue dit seulement la famille.
      message: [sujet, forme && !demandeLaForme ? nomsFormes(forme) : null, message]
        .filter(Boolean)
        .join("\n"),
      declarations,
      consentementContact: consent,
      consentementWhatsapp: accordWhatsapp,
      origine: `vitrine-${demarche.toLowerCase()}`,
    }).then(setResultat, () =>
      setResultat({ enregistree: false, motif: t("enregistrement.indisponible") }),
    );
  }

  function envoyer(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    enregistrer();
    const objet = encodeURIComponent(t("objet", { sujet }));
    window.location.href = `mailto:${DESTINATAIRE}?subject=${objet}&body=${encodeURIComponent(corps())}`;
    setEnvoye(true);
  }

  const etiquette = "formulaire-service__etiquette";

  return (
    <form className="formulaire-service" onSubmit={envoyer} id="demande">
      <h3 className="formulaire-service__titre">{t("titre")}</h3>
      <p className="formulaire-service__detail">{t("detail")}</p>

      {/* Le service est affiché, pas masqué : le visiteur doit voir sur quoi
          part sa demande. Il reste modifiable — on se trompe de page. */}
      <div>
        <label className={etiquette} htmlFor="demande-sujet">
          {t("champSujet")}
        </label>
        <input
          id="demande-sujet"
          className="formulaire-service__champ"
          type="text"
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
          required
        />
      </div>

      {/* La forme juridique, quand le service en appelle une.
          Elle est exigée : c'est elle qui détermine le capital minimum, le
          nombre d'associés, le passage ou non chez le notaire et le montant des
          frais. Une demande de création qui ne la dit pas oblige le cabinet à
          rappeler pour la poser — un aller-retour de plus, sur la démarche où
          le visiteur est déjà le plus hésitant. */}
      {formes && formes.length > 0 && !demandeLaForme && (
        <div>
          <label className={etiquette} htmlFor="demande-forme">
            {t("champForme")}
          </label>
          <select
            id="demande-forme"
            className="formulaire-service__champ"
            value={forme}
            onChange={(e) => setForme(e.target.value)}
            required
          >
            {/* Aucune forme n'est cochée d'office quand le visiteur arrive sans
                en avoir choisi une : un choix par défaut serait pris pour un
                conseil du cabinet. */}
            <option value="">{t("choisirForme")}</option>
            {formes.map((code) => (
              <option key={code} value={code}>
                {nomsFormes(code)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="formulaire-service__paire">
        <div>
          <label className={etiquette} htmlFor="demande-nom">
            {t("champNom")}
          </label>
          <input
            id="demande-nom"
            className="formulaire-service__champ"
            type="text"
            autoComplete="name"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </div>
        <div>
          {/* Le téléphone est exigé, le courriel facultatif : une part
              importante de la clientèle du cabinet traite par appel et par
              WhatsApp plutôt que par messagerie. */}
          <label className={etiquette} htmlFor="demande-tel">
            {t("champTelephone")}
          </label>
          <input
            id="demande-tel"
            className="formulaire-service__champ"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+237 6…"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className={etiquette} htmlFor="demande-courriel">
          {t("champCourriel")} <span className="formulaire-service__facultatif">{t("facultatif")}</span>
        </label>
        <input
          id="demande-courriel"
          className="formulaire-service__champ"
          type="email"
          autoComplete="email"
          value={courriel}
          onChange={(e) => setCourriel(e.target.value)}
        />
      </div>

      <div>
        <label className={etiquette} htmlFor="demande-message">
          {t("champMessage")} <span className="formulaire-service__facultatif">{t("facultatif")}</span>
        </label>
        <textarea
          id="demande-message"
          className="formulaire-service__champ formulaire-service__zone"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          LE PROJET, EN QUELQUES RÉPONSES — TOUTES FACULTATIVES

          Ce que le visiteur dit ici n'est pas redemandé au téléphone : ses
          réponses ouvrent son dossier déjà rempli. Aucune n'est exigée, et
          c'est délibéré : chaque champ obligatoire de plus est un visiteur de
          moins, et un dossier à moitié rempli vaut mieux qu'une demande perdue.
          ───────────────────────────────────────────────────────────────────── */}
      {questions.length > 0 && (
        <fieldset className="formulaire-service__projet">
          <legend className="formulaire-service__projet-titre">{t("projetTitre")}</legend>
          <p className="formulaire-service__projet-detail">{t("projetDetail")}</p>
          <div className="formulaire-service__paire">
            {questions.map((question) => {
              const id = `declaration-${question.code}`;
              const valeur = declarations[question.code] ?? "";
              const numerique = question.type === "ENTIER" || question.type === "DECIMAL";
              return (
                <div key={question.code}>
                  <label className={`${etiquette} formulaire-service__question`} htmlFor={id}>
                    {question.libelle}
                  </label>
                  {question.type === "ENUM" || question.type === "BOOLEEN" ? (
                    <select
                      id={id}
                      className="formulaire-service__champ"
                      value={valeur}
                      onChange={(e) => declarer(question.code, e.target.value)}
                    >
                      <option value="">{t("choisir")}</option>
                      {question.type === "BOOLEEN" ? (
                        <>
                          <option value="oui">{t("oui")}</option>
                          <option value="non">{t("non")}</option>
                        </>
                      ) : (
                        question.valeurs.map((v) => (
                          <option key={v.valeur} value={v.valeur}>
                            {v.libelle}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <input
                      id={id}
                      className="formulaire-service__champ"
                      type="text"
                      inputMode={numerique ? "numeric" : undefined}
                      maxLength={300}
                      placeholder={question.unite ?? undefined}
                      value={valeur}
                      onChange={(e) => declarer(question.code, e.target.value)}
                    />
                  )}
                  {question.aide && <p className="formulaire-service__aide">{question.aide}</p>}
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Le consentement est requis avant envoi : ces données sont
          personnelles, et le cabinet doit pouvoir prouver qu'il l'a obtenu. */}
      <label className="formulaire-service__consentement">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        {t("consentement")}
      </label>

      {/* ⚠️ UNE SECONDE CASE, FACULTATIVE, ET SON PROPRE TEXTE (14 octobre 2026).
          Le cabinet envoie ses propositions par WhatsApp, le canal que ses
          clients lisent. Il ne peut le faire que si le client l'a accepté en
          toutes lettres : la case du dessus parle d'être recontacté, pas de
          recevoir des messages. Sans cet accord, le responsable n'a pas le
          bouton d'envoi, et il lit pourquoi. */}
      <label className="formulaire-service__consentement">
        <input
          id="demande-accord-whatsapp"
          type="checkbox"
          checked={accordWhatsapp}
          onChange={(e) => setAccordWhatsapp(e.target.checked)}
        />
        {t("consentementWhatsapp")}
      </label>

      <div className="formulaire-service__actions">
        <button type="submit" className="bouton bouton--principal bouton--large">
          {t("envoyer")}
          <IconeVitrine nom="fleche" taille={16} />
        </button>
        <a
          className="bouton bouton--secondaire bouton--large"
          href={`https://wa.me/${numeroWhatsapp}?text=${encodeURIComponent(corps())}`}
          target="_blank"
          rel="noreferrer noopener"
          /* Désactivé tant que le consentement n'est pas donné : la même règle
             doit valoir quel que soit le canal. */
          aria-disabled={!consent}
          onClick={(e) => {
            if (!consent) {
              e.preventDefault();
              return;
            }
            // ⚠️ Pas de `preventDefault` : WhatsApp s'ouvre sur le geste même,
            // et l'enregistrement part en parallèle. Même règle qu'à la page
            // Contact.
            enregistrer();
          }}
        >
          <IconeVitrine nom="whatsapp" taille={16} />
          {t("envoyerWhatsapp")}
        </a>
      </div>

      {/* `role="status"` : l'annonce est lue sans voler le focus du champ. */}
      <p className="formulaire-service__confirmation" role="status">
        {envoye ? t("confirmation") : ""}
      </p>

      {/* ⚠️ DEUX CHOSES DISTINCTES, DEUX LIGNES DISTINCTES.
          Au-dessus : le canal est parti, courriel ou WhatsApp. Ici : la demande
          est-elle entrée chez le cabinet. Les confondre ferait croire au visiteur
          que tout va bien alors que seul son courriel est parti, et il attendrait
          un rappel que personne n'a programmé. */}
      {resultat !== null && (
        <p
          role="status"
          className="formulaire-service__confirmation"
          style={{
            color:
              resultat !== "en-cours" && !resultat.enregistree
                ? "var(--danger)"
                : undefined,
          }}
        >
          {resultat === "en-cours"
            ? t("enregistrement.enCours")
            : resultat.enregistree
              ? t("enregistrement.reussi")
              : t("enregistrement.echec", { motif: resultat.motif })}
        </p>
      )}
    </form>
  );
}
