"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { lireLeDecoupage, lireLesLieux } from "@/app/lib/actions-geographie";
import type { Decoupage, LieuxDeLArrondissement } from "@/app/lib/geographie";

/** La valeur des listes qui ouvre la saisie libre. */
const AUTRE = "__autre__";

/**
 * Où sera installée l'entreprise : région › département › arrondissement › ville › quartier.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI (réunion du 4 novembre 2026)
 *
 * La responsable : les centres de formalités ne sont pas partout, la région ne suffit pas. La
 * VILLE dit où déposer le dossier, le QUARTIER dit le centre des impôts de rattachement.
 *
 * CE QUE LE COMPOSANT REMPLIT
 *
 * `arrondissement_siege` (le code officiel de l'INC), et avec lui `region_siege` (la valeur
 * du barème : `LITTORAL`…), `ville_siege` et `quartier_siege`. Le formulaire ne pose donc
 * pas ces trois questions une seconde fois.
 *
 * ⚠️ LES QUARTIERS SONT PARTIELS (aucune liste publique complète n'existe) : « Autre
 * quartier » ouvre toujours une saisie libre, de même que « Autre ville ». Et si le
 * référentiel ne répond pas, ville et quartier se tapent à la main : la demande part quand même.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function LocalisationDuSiege({
  libelle,
  aide,
  valeurs,
  declarer,
}: {
  libelle: string;
  aide: string;
  valeurs: Record<string, string>;
  declarer: (code: string, valeur: string) => void;
}) {
  const t = useTranslations("vitrine.demande.localisation");
  const [decoupage, setDecoupage] = useState<Decoupage | null | "en-cours">("en-cours");
  const [regionCode, setRegionCode] = useState("");
  const [departementCode, setDepartementCode] = useState("");
  /* Les lieux, rangés avec l'arrondissement qu'ils décrivent : ceux d'un arrondissement
     quitté ne s'affichent plus, sans avoir à les effacer. */
  const [charges, setCharges] = useState<{ code: string; lieux: LieuxDeLArrondissement | null }>({
    code: "",
    lieux: null,
  });
  const [villeLibre, setVilleLibre] = useState(false);
  const [quartierLibre, setQuartierLibre] = useState(false);

  useEffect(() => {
    let vivant = true;
    lireLeDecoupage().then((d) => vivant && setDecoupage(d));
    return () => {
      vivant = false;
    };
  }, []);

  const arrondissementCode = valeurs.arrondissement_siege ?? "";
  const ville = valeurs.ville_siege ?? "";
  const quartier = valeurs.quartier_siege ?? "";

  const lieux = charges.code === arrondissementCode ? charges.lieux : null;

  useEffect(() => {
    let vivant = true;
    if (arrondissementCode) {
      lireLesLieux(arrondissementCode).then((l) => {
        if (!vivant) return;
        setCharges({ code: arrondissementCode, lieux: l });
        // Rien à choisir : la saisie libre d'emblée.
        if (!l || l.villes.length + l.localites.length === 0) setVilleLibre(true);
      });
    }
    return () => {
      vivant = false;
    };
  }, [arrondissementCode]);

  const regions = decoupage && decoupage !== "en-cours" ? decoupage.regions : [];
  const region = regions.find((r) => r.code === regionCode);
  const departement = region?.departements.find((d) => d.code === departementCode);

  /** Les quartiers de la ville choisie, ou ceux de l'arrondissement si aucun n'a de ville. */
  const quartiers = useMemo(() => {
    const tous = lieux?.quartiers ?? [];
    const deLaVille = tous.filter((q) => !q.ville || q.ville === ville);
    return deLaVille.map((q) => q.nom).sort((a, b) => a.localeCompare(b, "fr"));
  }, [lieux, ville]);

  function choisirRegion(code: string) {
    setRegionCode(code);
    setDepartementCode("");
    declarer("region_siege", regions.find((r) => r.code === code)?.cle ?? "");
    choisirArrondissement("");
  }
  function choisirArrondissement(code: string) {
    declarer("arrondissement_siege", code);
    declarer("ville_siege", "");
    declarer("quartier_siege", "");
    setVilleLibre(false);
    setQuartierLibre(false);
  }
  function choisirVille(valeur: string) {
    if (valeur === AUTRE) {
      setVilleLibre(true);
      declarer("ville_siege", "");
    } else {
      declarer("ville_siege", valeur);
    }
    declarer("quartier_siege", "");
    setQuartierLibre(false);
  }
  function choisirQuartier(valeur: string) {
    if (valeur === AUTRE) {
      setQuartierLibre(true);
      declarer("quartier_siege", "");
    } else {
      declarer("quartier_siege", valeur);
    }
  }

  const indisponible = decoupage === null;
  const champ = "formulaire-service__champ";
  const etiquette = "formulaire-service__question";

  return (
    <fieldset className="localisation-du-siege">
      <legend className={etiquette}>{libelle}</legend>
      {aide && <p className="formulaire-service__aide">{aide}</p>}
      {decoupage === "en-cours" && <p className="formulaire-service__aide">{t("chargement")}</p>}
      {indisponible && <p className="formulaire-service__aide">{t("indisponible")}</p>}

      <div className="formulaire-service__paire">
        {!indisponible && (
          <>
            <div>
              <label className={etiquette} htmlFor="localisation-region">
                {t("region")}
              </label>
              <select
                id="localisation-region"
                className={champ}
                value={regionCode}
                disabled={decoupage === "en-cours"}
                onChange={(e) => choisirRegion(e.target.value)}
              >
                <option value="">{t("choisir")}</option>
                {regions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={etiquette} htmlFor="localisation-departement">
                {t("departement")}
              </label>
              <select
                id="localisation-departement"
                className={champ}
                value={departementCode}
                disabled={!region}
                onChange={(e) => {
                  setDepartementCode(e.target.value);
                  choisirArrondissement("");
                }}
              >
                <option value="">{t("choisir")}</option>
                {region?.departements.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={etiquette} htmlFor="localisation-arrondissement">
                {t("arrondissement")}
              </label>
              <select
                id="localisation-arrondissement"
                className={champ}
                value={arrondissementCode}
                disabled={!departement}
                onChange={(e) => choisirArrondissement(e.target.value)}
              >
                <option value="">{t("choisir")}</option>
                {departement?.arrondissements.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className={etiquette} htmlFor="localisation-ville">
            {t("ville")}
          </label>
          {villeLibre || indisponible ? (
            <input
              id="localisation-ville"
              className={champ}
              type="text"
              maxLength={120}
              value={ville}
              onChange={(e) => declarer("ville_siege", e.target.value)}
            />
          ) : (
            <select
              id="localisation-ville"
              className={champ}
              value={ville}
              disabled={!lieux}
              onChange={(e) => choisirVille(e.target.value)}
            >
              <option value="">{t("choisir")}</option>
              {lieux && lieux.villes.length > 0 && (
                <optgroup label={t("villes")}>
                  {lieux.villes.map((v) => (
                    <option key={`v-${v.nom}`} value={v.nom}>
                      {v.nom}
                    </option>
                  ))}
                </optgroup>
              )}
              {lieux && lieux.localites.length > 0 && (
                <optgroup label={t("localites")}>
                  {lieux.localites.map((v) => (
                    <option key={`l-${v.nom}`} value={v.nom}>
                      {v.nom}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value={AUTRE}>{t("autreVille")}</option>
            </select>
          )}
        </div>

        <div>
          <label className={etiquette} htmlFor="localisation-quartier">
            {t("quartier")}
          </label>
          {quartierLibre || indisponible || quartiers.length === 0 ? (
            <input
              id="localisation-quartier"
              className={champ}
              type="text"
              maxLength={120}
              value={quartier}
              disabled={!ville && !indisponible}
              onChange={(e) => declarer("quartier_siege", e.target.value)}
            />
          ) : (
            <select
              id="localisation-quartier"
              className={champ}
              value={quartier}
              onChange={(e) => choisirQuartier(e.target.value)}
            >
              <option value="">{t("choisir")}</option>
              {quartiers.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
              <option value={AUTRE}>{t("autreQuartier")}</option>
            </select>
          )}
          <p className="formulaire-service__aide">{t("quartierPartiel")}</p>
        </div>
      </div>
    </fieldset>
  );
}
