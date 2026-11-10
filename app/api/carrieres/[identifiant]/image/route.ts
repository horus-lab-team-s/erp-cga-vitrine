import { BASE_API } from "@/app/lib/api";

/**
 * L'image d'une offre ouverte (18 octobre 2026, point 25), relayée depuis le backend. Le
 * type a été lu dans les octets à l'arrivée : seules JPEG et PNG existent ; une offre close
 * ou en brouillon rend 404, comme son texte.
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ identifiant: string }> }) {
  const { identifiant } = await params;
  const reponse = await fetch(`${BASE_API}/vitrine/offres/${encodeURIComponent(identifiant)}/image`, {
    next: { revalidate: 300 },
  }).catch(() => null);
  if (!reponse || !reponse.ok) return new Response("image introuvable", { status: 404 });
  const type = reponse.headers.get("content-type") === "image/png" ? "image/png" : "image/jpeg";
  return new Response(await reponse.arrayBuffer(), {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" },
  });
}
