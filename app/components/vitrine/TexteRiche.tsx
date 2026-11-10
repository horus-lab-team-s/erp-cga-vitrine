import type { BlocDeTexte, Segment } from "@/app/lib/carrieres";

/**
 * Les blocs d'un texte rédigé au mini-éditeur de la console, rendus en JSX (16 octobre 2026).
 * Aucun `dangerouslySetInnerHTML` : un texte saisi ne devient jamais du balisage.
 */
export function TexteRiche({ blocs }: { blocs: BlocDeTexte[] }) {
  return (
    <div className="texte-riche">
      {blocs.map((b, i) =>
        b.type === "intertitre" ? (
          <h3 key={i}>{b.texte}</h3>
        ) : b.type === "liste" ? (
          <ul key={i}>
            {b.points.map((p, j) => (
              <li key={j}>
                <Segments segments={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Segments segments={b.segments} />
          </p>
        ),
      )}
    </div>
  );
}

function Segments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.gras ? <strong key={i}>{s.texte}</strong> : s.italique ? <em key={i}>{s.texte}</em> : <span key={i}>{s.texte}</span>,
      )}
    </>
  );
}
