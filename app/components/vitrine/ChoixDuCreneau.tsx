"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { lireLesCreneaux } from "@/app/lib/actions-acquisition";
import type { CreneauxProposes, ModeRendezVous } from "@/app/lib/acquisition";

/**
 * Le rendez-vous : où, et quand (9 novembre 2026).
 *
 * ⚠️ LES CRÉNEAUX VIENNENT DU CABINET. Le site n'en invente aucun : il lit ceux que le
 * responsable de la création laisse ouverts, et le serveur revérifie au dépôt qu'il est
 * toujours libre (deux visiteurs peuvent viser le même). Les heures sont celles de Douala.
 */
export function ChoixDuCreneau({
  mode,
  debut,
  choisirMode,
  choisirDebut,
}: {
  mode: ModeRendezVous;
  debut: string;
  choisirMode: (mode: ModeRendezVous) => void;
  choisirDebut: (debut: string) => void;
}) {
  const t = useTranslations("vitrine.demande.parcours");
  const [proposes, setProposes] = useState<CreneauxProposes | null | "en-cours">("en-cours");

  useEffect(() => {
    let vivant = true;
    lireLesCreneaux().then((c) => vivant && setProposes(c));
    return () => {
      vivant = false;
    };
  }, []);

  const parJour = new Map<string, string[]>();
  if (proposes && proposes !== "en-cours") {
    for (const c of proposes.creneaux) {
      const jour = c.slice(0, 10);
      parJour.set(jour, [...(parJour.get(jour) ?? []), c]);
    }
  }
  const modes = proposes && proposes !== "en-cours" ? proposes.modes : [];
  const jourLisible = (jour: string) =>
    new Date(`${jour}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <fieldset className="formulaire-service__projet">
      <legend className="formulaire-service__projet-titre">{t("mode")}</legend>
      <div className="formulaire-service__paire">
        {(["PRESENTIEL", "EN_LIGNE"] as const)
          .filter((m) => modes.length === 0 || modes.includes(m))
          .map((m) => (
            <label key={m} className="formulaire-service__consentement">
              <input type="radio" name="rdv-mode" checked={mode === m} onChange={() => choisirMode(m)} />
              {m === "PRESENTIEL" ? t("presentiel") : t("enLigne")}
            </label>
          ))}
      </div>

      <p className="formulaire-service__projet-titre">{t("creneau")}</p>
      {proposes === "en-cours" && <p className="formulaire-service__aide">{t("chargement")}</p>}
      {proposes === null && <p className="formulaire-service__aide">{t("indisponible")}</p>}
      {proposes && proposes !== "en-cours" && parJour.size === 0 && (
        <p className="formulaire-service__aide">{t("aucun")}</p>
      )}
      <div className="creneaux">
        {[...parJour.entries()].map(([jour, heures]) => (
          <div key={jour} className="creneaux__jour">
            <p className="creneaux__date">{jourLisible(jour)}</p>
            <div className="creneaux__heures">
              {heures.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="creneaux__heure"
                  aria-pressed={debut === c}
                  onClick={() => choisirDebut(c)}
                >
                  {c.slice(11, 16).replace(":", " h ")}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="formulaire-service__aide">{t("penalite")}</p>
    </fieldset>
  );
}
