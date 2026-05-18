import type { ReactNode } from "react";

export function TopBar({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <header className="topbar">
      <div>
        <h1 className="title">{title}</h1>
        {subtitle && <p className="subtitle muted">{subtitle}</p>}
      </div>
    </header>
  );
}
