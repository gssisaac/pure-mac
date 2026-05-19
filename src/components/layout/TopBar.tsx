import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function TopBar({
  title,
  subtitle,
  className,
  end,
}: {
  title: string;
  subtitle?: ReactNode;
  className?: string;
  /** Right-aligned region in the title row (e.g. toolbar controls). */
  end?: ReactNode;
}) {
  return (
    <header className={cn("topbar", className)}>
      <div className="topbar-inner">
        <div className="topbar-titles">
          <h1 className="title">{title}</h1>
          {subtitle && <p className="subtitle muted">{subtitle}</p>}
        </div>
        {end ? <div className="topbar-end">{end}</div> : null}
      </div>
    </header>
  );
}
