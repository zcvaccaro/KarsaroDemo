import { useEffect, useMemo, useState } from "react";
import { PageLink } from "../components/PageLink";
import {
  CLIENT_IMPORT_FIELDS,
  IMPORT_PRESETS,
  SAMPLE_CLIENT_CSV,
  guessField,
  mapCsvRows,
  parseCsv,
  type ClientImportField,
  type CsvTable,
} from "../lib/csv";

export function ImportClientsPage() {
  const [sourceId, setSourceId] = useState(IMPORT_PRESETS[0]?.id ?? "generic");
  const [table, setTable] = useState<CsvTable | null>(null);
  const [mapping, setMapping] = useState<Record<string, ClientImportField>>({});
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const source =
    IMPORT_PRESETS.find((preset) => preset.id === sourceId) ??
    IMPORT_PRESETS[0];
  const preview = useMemo(
    () => (table ? mapCsvRows(table, mapping).slice(0, 8) : []),
    [table, mapping],
  );

  function applyGuesses(headers: string[]) {
    const next: Record<string, ClientImportField> = {};
    for (const header of headers) next[header] = guessField(header);
    setMapping(next);
  }

  function loadSample() {
    const parsed = parseCsv(SAMPLE_CLIENT_CSV);
    setTable(parsed);
    applyGuesses(parsed.headers);
    setSampleLoaded(true);
  }

  useEffect(() => {
    const parsed = parseCsv(SAMPLE_CLIENT_CSV);
    setTable(parsed);
    const next: Record<string, ClientImportField> = {};
    for (const header of parsed.headers) next[header] = guessField(header);
    setMapping(next);
    setSampleLoaded(true);
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        People
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Import clients
      </h1>
      <p className="mt-3 text-base leading-relaxed text-karsa-muted">
        Pick the product you are leaving, export a client CSV there, then choose
        that file here. Karsaro guesses the columns so you can check them,
        preview a few rows, and import. Duplicates are skipped.
      </p>
      <p className="mt-2 text-sm text-karsa-faint">
        <PageLink to="/dashboard/clients">← Clients</PageLink>
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-karsa-faint uppercase">
            1. Choose a source
          </p>
          <p className="mt-1 text-sm text-karsa-muted">
            Select the product you are leaving. Karsaro shows how to export from
            that app, then you choose the file here.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {IMPORT_PRESETS.map((preset) => {
              const selected = preset.id === sourceId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    selected
                      ? "border-karsa-accent bg-karsa-accent-soft text-karsa-text"
                      : "border-karsa-border-subtle text-karsa-muted hover:border-karsa-border hover:text-karsa-text"
                  }`}
                  onClick={() => setSourceId(preset.id)}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          {source ? (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-karsa-muted">
              {source.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-medium tracking-wide text-karsa-faint uppercase">
            2. Choose the exported file
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            className="mt-2 block w-full text-sm text-karsa-muted file:mr-3 file:rounded-md file:border-0 file:bg-karsa-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-karsa-bg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const text = String(reader.result ?? "");
                const parsed = parseCsv(text);
                if (parsed.headers.length === 0) {
                  setTable(null);
                  return;
                }
                setSampleLoaded(false);
                setTable(parsed);
                applyGuesses(parsed.headers);
              };
              reader.readAsText(file);
            }}
          />
          <button
            type="button"
            className="mt-3 text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
            onClick={loadSample}
          >
            Reload sample
          </button>
        </div>

        {table ? (
          <>
            <div>
              <p className="text-xs font-medium tracking-wide text-karsa-faint uppercase">
                3. Check the column mapping
              </p>
              <p className="mt-1 text-sm text-karsa-muted">
                Karsaro reads the header row and guesses first name, last name,
                email, phone, and notes. Fix any that look wrong with the
                dropdown — you do not need to edit the spreadsheet itself unless
                a column is missing.
              </p>
              {sampleLoaded ? (
                <p className="mt-2 text-sm text-karsa-faint">
                  This is a sample — nothing is saved. First Name, Email
                  Address, and Mobile were guessed. Client was left as Ignore —
                  open that dropdown and pick Full name. Last names then show in
                  the preview.
                </p>
              ) : null}
              <div className="mt-3 space-y-2">
                {table.headers.map((header) => {
                  const field = mapping[header] ?? "skip";
                  const guessedWrong = sampleLoaded && header === "Client";
                  return (
                    <label
                      key={header}
                      className="grid gap-1 text-sm sm:grid-cols-[1fr_12rem] sm:items-center"
                    >
                      <span className="truncate text-karsa-text">
                        {header}
                        {field === "skip" ? (
                          <span className="ml-2 text-xs text-karsa-faint">
                            {guessedWrong ? "needs a pick" : "ignored"}
                          </span>
                        ) : null}
                      </span>
                      <select
                        value={field}
                        onChange={(e) =>
                          setMapping((prev) => ({
                            ...prev,
                            [header]: e.target.value as ClientImportField,
                          }))
                        }
                        className="cursor-pointer rounded-md border border-karsa-border bg-karsa-bg px-2 py-1.5 text-sm text-karsa-text"
                      >
                        {CLIENT_IMPORT_FIELDS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium tracking-wide text-karsa-faint uppercase">
                4. Preview
              </p>
              <p className="mt-1 text-sm text-karsa-muted">
                Glance at the first rows and try the dropdowns. In the full
                product you then import; this demo stays as a preview.
              </p>
              <ul className="mt-3 space-y-2">
                {preview.map((row, index) => (
                  <li
                    key={`${row.email}-${index}`}
                    className="border border-karsa-border-subtle px-3 py-2 text-sm"
                  >
                    <p className="text-karsa-text">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="text-xs text-karsa-muted">
                      {row.email || "No email"}
                      {row.phone ? ` · ${row.phone}` : ""}
                    </p>
                  </li>
                ))}
                {preview.length === 0 ? (
                  <li className="text-sm text-karsa-faint">
                    Map at least first name, full name, or email.
                  </li>
                ) : null}
              </ul>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
