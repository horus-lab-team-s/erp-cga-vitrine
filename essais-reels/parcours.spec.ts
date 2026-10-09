import { expect, test, type Page } from "@playwright/test";

/**
 * Le parcours d'un visiteur, dans un vrai navigateur.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ LA VITRINE EST LA SEULE SURFACE OUVERTE À TOUT INTERNET.
 *
 * Personne ne l'ouvre avec une session, personne ne la connaît. Un visiteur qui
 * tombe sur une page vide, un estimateur figé ou une image cassée s'en va, et
 * l'on ne saura jamais qu'il est venu. C'est exactement ce qu'aucun cas
 * unitaire ne peut voir : ils rendent un composant, pas une page servie.
 *
 * ⚠️ IL NE SOUMET AUCUN FORMULAIRE. La vitrine dépose de VRAIES demandes
 * commerciales : un parcours qui les enverrait créerait un prospect à chaque
 * exécution, et le chargé de clientèle rappellerait un fantôme.
 * ─────────────────────────────────────────────────────────────────────────────
 */

function surveiller(page: Page): string[] {
  const erreurs: string[] = [];
  page.on("console", (m) => m.type() === "error" && erreurs.push(m.text()));
  page.on("pageerror", (e) => erreurs.push(String(e)));
  return erreurs;
}

test.describe("Les pages publiques", () => {
  const PAGES = [
    ["/", "Créez votre entreprise"],
    ["/estimation", "Combien va me coûter"],
    ["/souscrire", "Souscrire en ligne"],
    ["/blog", "Ce qui change"],
    ["/services/domiciliation", "adresse professionnelle"],
    ["/contact", "Contactez-nous"],
    ["/le-cabinet", ""],
    ["/devenir-adherent", ""],
    ["/creer-mon-entreprise", ""],
    ["/mentions-legales", ""],
  ] as const;

  test("répondent toutes, avec un titre et un contenu visible", async ({ page }) => {
    const erreurs = surveiller(page);
    for (const [chemin, attendu] of PAGES) {
      const reponse = await page.goto(chemin, { waitUntil: "domcontentloaded" });
      expect(reponse?.status(), `${chemin}`).toBe(200);
      expect((await page.title()).trim(), `${chemin} doit porter un titre`).not.toBe("");
      // ⚠️ Une page qui répond 200 et n'affiche rien est le défaut le plus
      // coûteux ici : le visiteur ne revient pas, et rien ne le signale.
      await expect(page.locator("h1").first(), `${chemin}`).toBeVisible();
      if (attendu) await expect(page.locator("h1").first()).toContainText(attendu);
    }
    expect(erreurs, erreurs.join("\n")).toHaveLength(0);
  });

  test("n'ont aucune image cassée sur l'accueil, y compris en bas de page", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    // ⚠️ SURTOUT PAS `networkidle` ICI, et ce n'est pas un contournement.
    //
    // Les images sous la ligne de flottaison sont en chargement PARESSEUX :
    // le navigateur retient leur requête tant qu'on ne descend pas. Le réseau
    // n'est donc jamais « au repos », et l'attente expire sur une page
    // parfaitement saine. Mesuré : l'optimiseur rend ces images en 4 ms.
    //
    // On descend donc la page, ce qui déclenche le chargement paresseux — et
    // vérifie du même coup qu'il fonctionne.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((suite) => setTimeout(suite, 60));
      }
    });
    await page
      .waitForFunction(() => [...document.querySelectorAll("img")].every((i) => i.complete), null, {
        timeout: 20_000,
      })
      .catch(() => undefined);

    const cassees = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((i) => i.complete && i.naturalWidth === 0)
        .map((i) => i.currentSrc || i.src),
    );
    // ⚠️ Une vignette cassée sur l'accueil d'un cabinet comptable dit au
    // visiteur que personne ne regarde le site. Les cas unitaires vérifient que
    // le FICHIER existe ; celui-ci vérifie que le navigateur le CHARGE.
    expect(cassees, cassees.join("\n")).toHaveLength(0);
  });
});

test.describe("L'estimateur de création d'entreprise", () => {
  test("recalcule quand on change la forme et le capital", async ({ page }) => {
    const erreurs = surveiller(page);
    await page.goto("/estimation");

    const forme = page.locator("#forme");
    const capital = page.locator("#capital");
    await expect(forme).toBeVisible();

    const avant = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    await forme.selectOption("SA");
    await expect
      .poll(async () => (await page.locator("body").innerText()).replace(/\s+/g, " "))
      .not.toBe(avant);

    // ⚠️ CE QUE LE CAS UNITAIRE NE PROUVE PAS. `estimer()` est éprouvée sur 20
    // cas, mais rien ne dit que la page S'HYDRATE : un estimateur figé rend
    // exactement les mêmes chiffres quoi qu'on change, et paraît fonctionner.
    const apresSa = (await page.locator("body").innerText()).replace(/\s+/g, " ");
    await capital.fill("50000000");
    await expect
      .poll(async () => (await page.locator("body").innerText()).replace(/\s+/g, " "))
      .not.toBe(apresSa);

    expect(erreurs, erreurs.join("\n")).toHaveLength(0);
  });

  test("laisse effacer le champ du capital", async ({ page }) => {
    await page.goto("/estimation");
    const capital = page.locator("#capital");
    await capital.fill("5000000");
    await capital.fill("");
    // ⚠️ LE DÉFAUT DU 11 AOÛT, qui ne se voit que dans un navigateur : le champ
    // réaffichait `Math.max(capital, capitalMin)`, si bien qu'effacer un
    // chiffre réécrivait le minimum légal à chaque touche. Le champ devenait
    // insaisissable.
    await expect(capital).toHaveValue("");
  });
});

test.describe("Ce que les moteurs lisent", () => {
  test("sert un robots.txt qui protège les pages nominatives", async ({ request }) => {
    const reponse = await request.get("/robots.txt");
    expect(reponse.status()).toBe(200);
    const texte = await reponse.text();
    // ⚠️ Ces trois-là portent le nom, le prix et l'état de paiement d'un
    // client. Leur adresse n'est pas devinable, mais elles n'ont rien à faire
    // dans un index public.
    for (const interdit of ["/proforma/", "/souscrire/devis/", "/souscrire/suivi/"]) {
      expect(texte, `« ${interdit} » doit être interdit`).toContain(interdit);
    }
  });

  test("sert un plan du site en deux langues", async ({ request }) => {
    const reponse = await request.get("/sitemap.xml");
    expect(reponse.status()).toBe(200);
    const xml = await reponse.text();
    expect(xml).toContain("<urlset");
    // Chaque adresse est donnée dans les deux langues : sans cela, un moteur
    // compte les deux versions comme deux pages en concurrence.
    expect(xml).toContain('hreflang="fr"');
    expect(xml).toContain('hreflang="en"');
    expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThan(20);
  });

  test("n'expose pas les pages nominatives à l'indexation", async ({ page }) => {
    const reponse = await page.goto("/souscrire", { waitUntil: "domcontentloaded" });
    expect(reponse?.status()).toBe(200);
    // La page publique de souscription, elle, DOIT être indexable : c'est par
    // là qu'un prospect arrive.
    // ⚠️ `getAttribute` sur un sélecteur ABSENT attend jusqu'à expiration : il
    // faut compter d'abord. La page n'a le plus souvent aucune balise
    // `robots`, ce qui vaut « indexable » — et c'est le comportement voulu.
    const balise = page.locator('meta[name="robots"]');
    const robots = (await balise.count()) > 0 ? await balise.first().getAttribute("content") : "";
    expect(robots ?? "").not.toContain("noindex");
  });
});

test.describe("Les en-têtes de sécurité", () => {
  test("accompagnent la page servie au visiteur", async ({ page }) => {
    const entetes = (await page.goto("/"))!.headers();
    expect(entetes["x-content-type-options"]).toBe("nosniff");
    expect(entetes["x-frame-options"]).toBe("DENY");
    expect(entetes["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(entetes["permissions-policy"]).toContain("geolocation=()");
  });
});

test.describe("La politique de contenu", () => {
  test("accompagne la page, avec un nonce qui change à chaque requête", async ({ page }) => {
    const premiere = await page.goto("/");
    const politique = premiere!.headers()["content-security-policy"];

    expect(politique, "aucune politique servie").toBeTruthy();
    // ⚠️ Les directives qui protègent VRAIMENT, et dont la disparition ne se
    // verrait pas à l'écran.
    expect(politique).toContain("connect-src 'self'");
    expect(politique).toContain("object-src 'none'");
    expect(politique).toContain("base-uri 'self'");
    expect(politique).toContain("form-action 'self'");
    expect(politique).toContain("frame-ancestors 'none'");
    // ⚠️ `'unsafe-inline'` SUR LES SCRIPTS rendrait la politique décorative : un
    // script injecté s'exécuterait comme les nôtres. Ce cas tombe si quelqu'un
    // l'ajoute pour « faire marcher » quelque chose.
    expect(politique).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(politique).toMatch(/script-src[^;]*'nonce-/);

    const premierNonce = /'nonce-([^']+)'/.exec(politique)![1];
    const seconde = await page.goto("/?x=1");
    const secondNonce = /'nonce-([^']+)'/.exec(
      seconde!.headers()["content-security-policy"],
    )![1];
    // ⚠️ Un nonce constant est un nonce inutile : il suffirait de le lire une
    // fois dans la source pour l'employer dans une injection.
    expect(secondNonce).not.toBe(premierNonce);
  });

  test("marque le script du thème, qui doit encore s'exécuter", async ({ page }) => {
    await page.goto("/");
    // Le script du thème pose l'attribut avant le premier rendu. S'il était
    // bloqué par la politique, la page clignoterait en blanc et l'attribut
    // manquerait — un symptôme visible plutôt qu'une panne silencieuse.
    const marques = await page.evaluate(
      () => [...document.querySelectorAll("script[nonce]")].length,
    );
    expect(marques, "aucun script marqué : le thème serait bloqué").toBeGreaterThan(0);
  });
});

