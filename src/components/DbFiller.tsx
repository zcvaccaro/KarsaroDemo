/** Shown wherever the live product would load records from the database. */
export function DbFiller({ item }: { item: string }) {
  return (
    <p className="rounded-md border border-dashed border-karsa-border bg-karsa-surface/50 px-3 py-2 text-xs leading-relaxed text-karsa-muted">
      In the live app you can select from your stored {item}. This portfolio demo
      uses sample data in your browser only.
    </p>
  );
}
