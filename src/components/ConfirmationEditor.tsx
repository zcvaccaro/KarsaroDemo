import { useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmationMessageEditor } from "./ConfirmationMessageEditor";
import { confirmationPageTitle, formConfirmationHtml } from "../lib/store";

const inputClass =
  "mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2";

export function ConfirmationEditor({
  formId,
  formName,
}: {
  formId: string;
  formName: string;
}) {
  const defaultTitle = confirmationPageTitle(formName);
  const [title, setTitle] = useState(defaultTitle);
  const [html, setHtml] = useState(() => formConfirmationHtml(formName));
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(
          "In the live app this saves the confirmation pair. Demo preview only — booking flow uses seeded confirmation HTML.",
        );
      }}
    >
      <div className="max-w-xl">
        <label className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-karsa-faint">
          Defaults to “{formName} Confirmation”. Used in{" "}
          <Link
            to="/dashboard/forms/confirmations"
            className="text-karsa-accent-strong underline-offset-4 hover:underline"
          >
            Forms → Confirmations
          </Link>{" "}
          lists.
        </p>
      </div>

      <div className="border border-karsa-border-subtle bg-karsa-bg-elevated p-5">
        <h2 className="font-display text-xl text-karsa-text">Message</h2>
        <p className="mt-1 text-sm text-karsa-muted">
          Shown after clients submit{" "}
          <Link
            to={`/dashboard/forms/${formId}`}
            className="font-medium text-karsa-accent-strong underline-offset-4 hover:underline"
          >
            {formName}
          </Link>
          . The Continue / Close button label is set automatically in{" "}
          <Link
            to="/dashboard/settings/booking-flow"
            className="font-medium text-karsa-accent-strong underline-offset-4 hover:underline"
          >
            Booking flow
          </Link>{" "}
          based on whether another form follows.
        </p>
        <div className="mt-4">
          <ConfirmationMessageEditor
            value={html}
            onChange={setHtml}
            buttonLabel="Close"
          />
        </div>
      </div>

      {message ? (
        <p className="text-sm text-karsa-accent-strong">{message}</p>
      ) : null}

      <button
        type="submit"
        className="rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg"
      >
        Save confirmation
      </button>
    </form>
  );
}
