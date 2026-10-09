"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { DEMARCHES, cleDeLaDemarche } from "@/app/lib/acquisition";

import { IconeVitrine } from "./IconeVitrine";

/**
 * Formulaire « Lancer une démarche », posé sur la bannière.
 *
 * Son fond est un **verre dépoli à valeurs fixes** — `rgb(10 6 18 / 62%)` et un
 * flou de 18 px — et non un jeton de thème : il repose sur la photographie, pas
 * sur la page. Basculer en clair ou en sombre ne doit rien y changer.
 *
 * Il fonctionne : les champs sont contrôlés, validés, et l'envoi compose un
 * message WhatsApp pré-rempli.
 *
 * ⚠️ Pourquoi WhatsApp plutôt qu'un `POST` : le point d'entrée `/prospects`
 * n'existe pas encore, il viendra avec le contexte I · Création d'entreprise. Un
 * formulaire qui n'envoie nulle part serait pire qu'un lien franc — le prospect
 * croirait avoir été enregistré. WhatsApp est par ailleurs le canal
 * professionnel dominant au Cameroun, ce n'est pas un pis-aller.
 */

// ⚠️ La liste vivait ici, en double de `app/lib/acquisition.ts`. Les deux ont
// divergé : le 27 septembre, la copie de la bibliothèque est passée aux codes du
// catalogue et celle-ci était restée en minuscules. Une seule source désormais.
// Ce formulaire compose un message WhatsApp et ne dépose rien — mais il nomme la
// démarche au client, et deux listes finiraient par ne plus dire la même chose.

/** Indicatifs de la sous-région, le Cameroun en tête. */
const PAYS = [
  { code: "CM", drapeau: "🇨🇲", indicatif: "+237", nom: "Cameroun", longueur: 9 },
  { code: "GA", drapeau: "🇬🇦", indicatif: "+241", nom: "Gabon", longueur: 8 },
  { code: "CG", drapeau: "🇨🇬", indicatif: "+242", nom: "Congo", longueur: 9 },
  { code: "TD", drapeau: "🇹🇩", indicatif: "+235", nom: "Tchad", longueur: 8 },
  { code: "CF", drapeau: "🇨🇫", indicatif: "+236", nom: "Centrafrique", longueur: 8 },
  { code: "GQ", drapeau: "🇬🇶", indicatif: "+240", nom: "Guinée équatoriale", longueur: 9 },
  { code: "CI", drapeau: "🇨🇮", indicatif: "+225", nom: "Côte d'Ivoire", longueur: 10 },
  { code: "SN", drapeau: "🇸🇳", indicatif: "+221", nom: "Sénégal", longueur: 9 },
  { code: "FR", drapeau: "🇫🇷", indicatif: "+33", nom: "France", longueur: 9 },
  { code: "BE", drapeau: "🇧🇪", indicatif: "+32", nom: "Belgique", longueur: 9 },
  { code: "CA", drapeau: "🇨🇦", indicatif: "+1", nom: "Canada", longueur: 10 },
  { code: "GB", drapeau: "🇬🇧", indicatif: "+44", nom: "Royaume-Uni", longueur: 10 },
];

export function FormulaireDemarche({ onInteraction }: { onInteraction?: () => void }) {
  const t = useTranslations("vitrine.formulaire");
  const commun = useTranslations("commun");

  const [demarche, setDemarche] = useState<string>("CREATION");
  const [nom, setNom] = useState("");
  const [codePays, setCodePays] = useState("CM");
  const [telephone, setTelephone] = useState("");
  const [tente, setTente] = useState(false);

  const pays = PAYS.find((p) => p.code === codePays) ?? PAYS[0];
  const chiffres = telephone.replace(/\D/g, "");
  const telephoneValide = chiffres.length >= Math.min(8, pays.longueur);
  const nomValide = nom.trim().length >= 3;
  const complet = nomValide && telephoneValide;

  const numeroCabinet = commun("cabinet.whatsapp").replace(/\D/g, "");
  const message = [
    `${t("titre")} · ${commun("cabinet.nomCourt")}`,
    `${t("demarche")} : ${t(cleDeLaDemarche(demarche))}`,
    `${t("nom")} : ${nom.trim()}`,
    `${t("tel")} : ${pays.indicatif} ${chiffres}`,
  ].join("\n");
  const lien = `https://wa.me/${numeroCabinet}?text=${encodeURIComponent(message)}`;

  function envoyer(evenement: React.MouseEvent<HTMLAnchorElement>) {
    if (complet) return;
    // Champs incomplets : on retient la navigation et on montre ce qui manque,
    // plutôt que d'ouvrir WhatsApp avec un message tronqué.
    evenement.preventDefault();
    setTente(true);
  }

  return (
    <form
      className="formulaire-heros"
      onSubmit={(e) => e.preventDefault()}
      onFocusCapture={onInteraction}
    >
      <div>
        <h2 className="formulaire-heros__titre">{t("titre")}</h2>
        <p className="formulaire-heros__detail">{t("detail")}</p>
      </div>

      <div>
        <label className="champ__etiquette" htmlFor="demarche">
          {t("demarche")}
        </label>
        <select
          id="demarche"
          className="champ__saisie"
          value={demarche}
          onChange={(e) => setDemarche(e.target.value)}
        >
          {DEMARCHES.map((cle) => (
            <option key={cle} value={cle}>
              {/* ⚠️ La VALEUR est le code du catalogue, le LIBELLÉ vient des
                  traductions. Les deux ne se confondent pas : l'un est un
                  contrat avec le serveur, l'autre du texte qu'on relit. */}
              {t(cleDeLaDemarche(cle))}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="champ__etiquette" htmlFor="nom">
          {t("nom")}
        </label>
        <input
          id="nom"
          type="text"
          className="champ__saisie"
          placeholder={t("nomExemple")}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          autoComplete="name"
          aria-invalid={tente && !nomValide}
          style={
            tente && !nomValide ? { borderColor: "var(--danger)", borderWidth: 2 } : undefined
          }
        />
      </div>

      <div>
        <label className="champ__etiquette" htmlFor="telephone">
          {t("tel")}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="champ__saisie"
            style={{ flex: "none", width: 118 }}
            aria-label={t("tel")}
            value={codePays}
            onChange={(e) => setCodePays(e.target.value)}
          >
            {PAYS.map((p) => (
              <option key={p.code} value={p.code}>
                {p.drapeau} {p.indicatif}
              </option>
            ))}
          </select>

          <span
            className="champ__telephone"
            style={
              tente && !telephoneValide ? { borderColor: "var(--danger)" } : undefined
            }
          >
            <span className="champ__drapeau" aria-hidden="true">
              {pays.drapeau}
            </span>
            <span className="champ__indicatif">{pays.indicatif}</span>
            <input
              id="telephone"
              type="tel"
              inputMode="numeric"
              placeholder="699902184"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              autoComplete="tel-national"
              aria-invalid={tente && !telephoneValide}
            />
          </span>
        </div>
      </div>

      {tente && !complet && (
        <p
          role="alert"
          style={{
            margin: 0,
            font: "500 12px/1.5 var(--police-texte)",
            color: "#ffb4ad",
          }}
        >
          {/* ⚠️ Une virgule, et non un tiret : c'est une énumération de champs,
              pas une incise. Le tiret cadratin y faisait en outre entrer dans
              un message d'erreur un signe que le cabinet ne veut nulle part. */}
          {!nomValide ? `${t("nom")}, ` : ""}
          {!telephoneValide ? `${t("tel")}, ` : ""}
          {commun("formulaire.champsRequis")}
        </p>
      )}

      <a
        /* `bouton--inverse` et non `bouton--principal` : la bannière porte déjà
           une action magenta, celle du carrousel. Deux boutons de la même
           couleur primaire dans le même écran ne hiérarchisent plus rien — l'œil
           ne sait plus lequel est l'action principale. Le blanc plein tranche sur
           le panneau sombre du formulaire, reste au même niveau d'importance, et
           laisse le magenta désigner une seule chose à la fois. */
        className="bouton bouton--inverse formulaire-heros__envoi"
        href={lien}
        target="_blank"
        rel="noreferrer noopener"
        onClick={envoyer}
        aria-disabled={!complet}
        style={complet ? undefined : { opacity: 0.72 }}
      >
        {t("bouton")}
        <IconeVitrine nom="fleche" taille={17} />
      </a>

      <p className="formulaire-heros__pied">{t("pied")}</p>
    </form>
  );
}
