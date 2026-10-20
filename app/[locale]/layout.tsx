import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Inter, Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/app/lib/site";
import "@/app/globals.css";
import { headers } from "next/headers";

/* § 10.2 — Inter pour tout le corps de texte, Poppins cantonnée aux titres de page
   et aux grands chiffres : géométrique et large, superbe en grand, coûteuse en
   espace et moins lisible à 13 px. */
const inter = Inter({
  variable: "--police-texte-chargee",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--police-titre-chargee",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const DESCRIPTION =
  "Cabinet comptable, d'audit et de conseil agréé par le ministre des Finances. " +
  "Création d'entreprise, suivi comptable et fiscal, formations. Douala, Yaoundé, Bafoussam.";

/**
 * Les métadonnées communes : titre, description, et l'aperçu de partage par défaut.
 *
 * ⚠️ 20 octobre 2026 (audit du référencement) : la plupart des pages n'avaient aucun
 * aperçu Open Graph, et un lien partagé sur WhatsApp ou Facebook partait sans image ni
 * nom de site. Une page qui pose le sien (fiche de service, article) le remplace.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    /* Sans base, toute image d'aperçu déclarée par un chemin relatif est ignorée
       au partage : le lien part sur Facebook ou WhatsApp sans vignette. */
    metadataBase: new URL(SITE_URL),
    title: {
      default: "CGA Broad Range Consulting Group",
      template: "%s · CGA Broad Range Consulting Group",
    },
    description: DESCRIPTION,
    openGraph: {
      type: "website",
      siteName: "CGA Broad Range Consulting Group",
      locale: locale === "en" ? "en_GB" : "fr_FR",
      images: [{ url: "/images/heros/slide-1.jpg", alt: "CGA Broad Range Consulting Group" }],
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

/**
 * Ce que les moteurs lisent du cabinet lui-même (données structurées schema.org).
 *
 * ⚠️ Les seules adresses CONFIRMÉES : Akwa pour Douala. Yaoundé et Bafoussam portent leur
 * ville seule, tant que le cabinet n'a pas donné l'adresse précise.
 */
function donneesDuCabinet() {
  return {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    name: "CGA Broad Range Consulting Group",
    alternateName: "CGA Broad Range",
    url: SITE_URL,
    logo: `${SITE_URL}/marque/cga-logo-couleur.jpg`,
    image: `${SITE_URL}/images/heros/slide-1.jpg`,
    description: DESCRIPTION,
    telephone: "+237233424847",
    email: "contact@cga-brcgroup.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Akwa",
      postOfficeBoxNumber: "7761",
      addressLocality: "Douala",
      addressRegion: "Littoral",
      addressCountry: "CM",
    },
    areaServed: { "@type": "Country", name: "Cameroun" },
    department: [
      { "@type": "AccountingService", name: "CGA Broad Range · Yaoundé", address: { "@type": "PostalAddress", addressLocality: "Yaoundé", addressCountry: "CM" } },
      { "@type": "AccountingService", name: "CGA Broad Range · Bafoussam", address: { "@type": "PostalAddress", addressLocality: "Bafoussam", addressCountry: "CM" } },
    ],
    sameAs: [
      "https://web.facebook.com/CGABroadRangeConsulting",
      "https://cm.linkedin.com/company/cga-broad-range-consulting",
    ],
  };
}

/**
 * Les traductions qu'emportent les composants du NAVIGATEUR, et elles seules.
 *
 * ⚠️ 20 octobre 2026 : sans liste, next-intl envoyait à chaque page les textes de tout le
 * site (fiches de services, pages légales…), dans le HTML comme dans le JavaScript. Les
 * composants serveur lisent les leurs côté serveur ; un composant client qui viendrait à
 * lire un autre espace doit l'ajouter ici, sans quoi il afficherait sa clé.
 */
const ESPACES_DU_NAVIGATEUR = ["commun", "vitrine"] as const;
const PAGES_DU_NAVIGATEUR = ["estimation", "contact", "carrieres", "connexion", "panne"] as const;

async function messagesDuNavigateur() {
  const tous = (await getMessages()) as Record<string, Record<string, unknown>>;
  const pages = tous.pages ?? {};
  return {
    ...Object.fromEntries(ESPACES_DU_NAVIGATEUR.map((e) => [e, tous[e]])),
    pages: Object.fromEntries(PAGES_DU_NAVIGATEUR.map((p) => [p, pages[p]])),
  };
}

/** Pré-rend les deux langues plutôt que de les générer à la demande. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Applique le thème enregistré **avant le premier rendu**.
 *
 * Sans ce script, une page en mode sombre s'afficherait d'abord en clair le temps
 * que React s'hydrate : un éclair blanc en pleine nuit, sur chaque navigation. Le
 * script est volontairement minuscule et sans dépendance, il s'exécute en amont de
 * tout le reste.
 */
const APPLIQUER_THEME = `
(function () {
  try {
    var choix = localStorage.getItem('cga.theme');
    if (!choix) {
      choix = matchMedia('(prefers-color-scheme: dark)').matches ? 'sombre' : 'clair';
    }
    document.documentElement.dataset.theme = choix;
  } catch (e) {
    document.documentElement.dataset.theme = 'clair';
  }
})();
`;

export default async function LayoutRacine({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // ⚠️ Le nonce de la requête, posé par l'intergiciel. `null` en théorie
  // seulement : l'intergiciel couvre toutes les pages. `?? undefined` parce que
  // React refuse `nonce={null}`.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Permet le rendu statique des pages : sans cela, toute page appelant un message
  // bascule en rendu dynamique et perd le bénéfice du pré-rendu.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      data-theme="clair"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
      style={{
        // Les polices chargées par next/font priment sur les repères système
        // déclarés dans tokens.css, sans dupliquer la déclaration des jetons.
        ["--police-texte" as string]: "var(--police-texte-chargee), system-ui, sans-serif",
        ["--police-titre" as string]: "var(--police-titre-chargee), system-ui, sans-serif",
      }}
      suppressHydrationWarning
    >
      <head>
        {/* ⚠️ LE NONCE EST OBLIGATOIRE : la politique de contenu n'autorise
            que les scripts en ligne qui le portent. Sans lui, le thème ne
            s'applique plus avant le premier rendu, et la page clignote en blanc
            — un symptôme visible, ce qui est le bon échec. Voir
            `middleware.ts`. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: APPLIQUER_THEME }} />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(donneesDuCabinet()) }}
        />
        <NextIntlClientProvider messages={await messagesDuNavigateur()}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
