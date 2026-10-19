import { BASE_API } from "@/app/lib/api";

/**
 * Le livrable d'une prestation ponctuelle, par le lien signé (19 octobre 2026, point 22).
 *
 * ⚠️ Relayé tel quel depuis le serveur, qui seul vérifie le sceau et ne rend le PDF
 * qu'une fois la mission validée par un second. Jamais mis en cache : il est nominatif.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ identifiant: string }> }) {
  const { identifiant } = await params;
  const s = new URL(requete.url).searchParams.get("s") ?? "";
  const reponse = await fetch(
    `${BASE_API}/missions/${encodeURIComponent(identifiant)}/suivi/livrable?${new URLSearchParams({ s })}`,
    { cache: "no-store" },
  ).catch(() => null);
  if (!reponse || !reponse.ok) {
    return new Response("Ce livrable n'est pas disponible.", {
      status: reponse?.status === 409 ? 409 : 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(await reponse.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="livrable-${identifiant.replace(/[^A-Za-z0-9-]/g, "")}.pdf"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
