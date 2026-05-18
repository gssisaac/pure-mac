import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function TopBar({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("topbar", className)}>
      <div>
        <h1 className="title">{title}</h1>
        {subtitle && <p className="subtitle muted">{subtitle}</p>}
      </div>
    </header>
  );
}
