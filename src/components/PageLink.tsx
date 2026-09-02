import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const CLASS =
  "text-karsa-accent-strong underline-offset-4 hover:underline";

/** In-sentence link to another dashboard page named in helper copy. */
export function PageLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={className ? `${CLASS} ${className}` : CLASS}>
      {children}
    </Link>
  );
}
