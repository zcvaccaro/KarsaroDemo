/**
 * Karsaro product logo — orbit mark + Fraunces/Manrope wordmark.
 * Mirrors production `src/components/brand/karsaro-logo.tsx`.
 */
export function KarsaroLogo({
  size = "md",
  className,
  showSubtitle = true,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: boolean;
}) {
  const mark = size === "sm" ? 32 : size === "lg" ? 56 : 40;
  const title =
    size === "sm"
      ? "text-lg leading-none"
      : size === "lg"
        ? "text-4xl leading-none"
        : "text-2xl leading-none";
  const sub =
    size === "sm"
      ? "mt-0.5 text-[9px] tracking-[0.16em]"
      : size === "lg"
        ? "mt-1.5 text-xs tracking-[0.18em]"
        : "mt-0.5 text-[10px] tracking-[0.16em]";

  return (
    <span
      className={`inline-flex items-center gap-3 pt-1.5 ${className ?? ""}`.trim()}
      role="img"
      aria-label="Karsaro Booking"
    >
      <KarsaroMark size={mark} decorative className="shrink-0 overflow-visible" />
      <span className="min-w-0" aria-hidden="true">
        <span
          className={`block font-display tracking-tight text-karsa-text ${title}`}
        >
          Karsaro
        </span>
        {showSubtitle ? (
          <span
            className={`block font-medium text-karsa-faint uppercase ${sub}`}
          >
            Booking
          </span>
        ) : null}
      </span>
    </span>
  );
}

/** Orbit mark only — favicon-adjacent / compact chrome. */
export function KarsaroMark({
  size = 36,
  className,
  title = "Karsaro",
  decorative = false,
}: {
  size?: number;
  className?: string;
  title?: string;
  /** Hide from assistive tech when paired with visible wordmark / parent label. */
  decorative?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-14 -14 178 178"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      overflow="visible"
    >
      {decorative ? null : <title>{title}</title>}
      <circle
        cx="75"
        cy="75"
        r="65"
        fill="none"
        stroke="#688086"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Centered on ring stroke at top (cy = 75 − 65). */}
      <circle cx="75" cy="10" r="14" fill="#D98332" />
    </svg>
  );
}
