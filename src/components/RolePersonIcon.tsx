const ROLE_COLOR: Record<string, string> = {
  admin: "#C9A227",
  receptionist: "#2563EB",
  practitioner: "#16A34A",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  receptionist: "Receptionist",
  practitioner: "Practitioner",
};

export function RolePersonIcon({
  role,
  className = "",
}: {
  role: string | null | undefined;
  className?: string;
}) {
  const label = ROLE_LABEL[role ?? ""] ?? "Practitioner";
  const color = ROLE_COLOR[role ?? ""] ?? ROLE_COLOR.practitioner;

  return (
    <span
      className={`group/role relative inline-flex shrink-0 ${className}`}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        aria-hidden
        style={{ color }}
      >
        <circle cx="12" cy="8" r="3.4" fill="currentColor" />
        <path
          d="M5.2 19.2c0-3.3 3-5.4 6.8-5.4s6.8 2.1 6.8 5.4"
          fill="currentColor"
        />
      </svg>
      <span
        aria-hidden
        className="pointer-events-none absolute top-full right-0 z-50 mt-1 hidden whitespace-nowrap rounded-md border border-karsa-border bg-karsa-bg px-2 py-1 text-[10px] text-karsa-text shadow-md group-hover/role:block"
      >
        {label}
      </span>
    </span>
  );
}
