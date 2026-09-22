import { useEffect, useState } from "react";
import { PageLink } from "../components/PageLink";
import {
  guessWebsitePlatform,
  platformLabel,
  type WebsitePlatform,
} from "../lib/guess-platform";

const GUIDES: Record<
  Exclude<WebsitePlatform, "unknown">,
  { title: string; steps: string[] }
> = {
  squarespace: {
    title: "Squarespace",
    steps: [
      "Open Pages, then the page where you want Book Now.",
      "Add a Button block — or edit an existing button.",
      "Paste your Karsaro booking link as the button URL.",
      "Save, then click the button in a preview to confirm it opens your Karsaro flow.",
    ],
  },
  wix: {
    title: "Wix",
    steps: [
      "Open the Editor and select the button (or add a Button).",
      "Click the link icon and choose Web address.",
      "Paste your Karsaro booking link.",
      "Publish, then tap the live button to confirm.",
    ],
  },
  wordpress: {
    title: "WordPress",
    steps: [
      "Edit the page or post (block editor or your theme’s button widget).",
      "Select the button and set its link to your Karsaro booking URL.",
      "If you use a classic menu, Appearance → Menus → add a Custom Link with the same URL.",
      "Update / publish, then open the live page and click through.",
    ],
  },
  instagram: {
    title: "Instagram",
    steps: [
      "Open your professional profile → Edit profile.",
      "Paste the Karsaro booking link in Website (or add a link sticker on Stories / a Link in bio tool).",
      "Save, then open the profile as a visitor and tap the link.",
    ],
  },
  "google-business": {
    title: "Google Business",
    steps: [
      "Open Google Business Profile Manager.",
      "Find the website / appointment link field (or Buttons → Add a button).",
      "Paste your Karsaro booking link.",
      "Save, then search your business on Google and tap the button.",
    ],
  },
  custom: {
    title: "Custom site",
    steps: [
      "Open the HTML for the page where you want Book Now.",
      "Find the button or text link — that is the anchor tag, usually written as <a href=\"...\">.",
      "Paste your Karsaro booking link as the href on that anchor (for example <a href=\"YOUR_BOOKING_LINK\">Book Now</a>).",
      "Save and publish, then click the live link to confirm it opens your Karsaro flow.",
    ],
  },
};

function demoBookingUrl() {
  if (typeof window === "undefined") return "#/book/sample-studio";
  return `${window.location.origin}${window.location.pathname}#/book/sample-studio`;
}

export function WebsitePage() {
  const [bookingUrl] = useState(demoBookingUrl);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState<WebsitePlatform>("custom");
  const [guessed, setGuessed] = useState<WebsitePlatform>("unknown");

  useEffect(() => {
    const next = guessWebsitePlatform(url);
    setGuessed(next);
    if (next !== "unknown") setOpen(next);
  }, [url]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Sync
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Your Website
      </h1>
      <p className="mt-3 text-base leading-relaxed text-karsa-muted">
        Put a Book Now button on the site or social profile you already have.
        The button just opens your public Karsaro page — the exact flow clients
        see when they book online, including every change you make in{" "}
        <PageLink to="/dashboard/settings/booking-flow">Booking flow</PageLink>.
      </p>

      <div className="mt-8 space-y-8">
        <section className="border border-karsa-border-subtle p-5">
          <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
            Your public booking link
          </p>
          <p className="mt-2 break-all font-mono text-sm text-karsa-text">
            {bookingUrl}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-karsa-muted">
            In this demo the link opens the sample public booking page. In the
            real product it is your live{" "}
            <span className="font-mono">/book/your-slug</span> URL.
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-4 rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg hover:bg-karsa-accent-strong"
          >
            {copied ? "Copied" : "Copy booking link"}
          </button>
        </section>

        <section>
          <h2 className="text-lg font-medium text-karsa-text">
            Help me add a Book Now button
          </h2>
          <p className="mt-2 text-sm text-karsa-muted">
            Squarespace, Wix, WordPress, Instagram, Google Business, and custom
            HTML sites all need the same booking URL in a button or anchor.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(GUIDES) as Exclude<WebsitePlatform, "unknown">[]).map(
              (key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOpen(key)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    open === key
                      ? "border-karsa-accent bg-karsa-accent/15 text-karsa-accent-strong"
                      : "border-karsa-border text-karsa-muted hover:text-karsa-text"
                  }`}
                >
                  {GUIDES[key].title}
                </button>
              ),
            )}
          </div>
          {open !== "unknown" ? (
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-karsa-muted">
              {GUIDES[open].steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
        </section>

        <section className="border border-karsa-border-subtle p-5">
          <h2 className="text-lg font-medium text-karsa-text">
            Let Karsaro guess your platform
          </h2>
          <p className="mt-2 text-sm text-karsa-muted">
            Paste a website, Instagram, or Google Business URL. This demo only
            looks at the address — the live product can also inspect the public
            page source.
          </p>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourstudio.com"
            className="mt-3 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
          />
          <p className="mt-2 text-sm text-karsa-text">
            Guess:{" "}
            <span className="text-karsa-accent-strong">
              {platformLabel(guessed)}
            </span>
          </p>
        </section>
      </div>
    </div>
  );
}
