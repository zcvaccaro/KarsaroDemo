/** Shown on demo sections that are not a full interactive mirror of the product. */
export function FullVersionNote({
  more,
}: {
  /** Short description of what the live software adds beyond this demo surface. */
  more: string;
}) {
  return (
    <aside className="rounded-md border border-dashed border-karsa-border bg-karsa-surface/50 px-3 py-3 text-xs leading-relaxed text-karsa-muted">
      <p className="font-medium text-karsa-text">In the full software</p>
      <p className="mt-1.5">{more}</p>
    </aside>
  );
}
