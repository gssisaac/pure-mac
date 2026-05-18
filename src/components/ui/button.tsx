import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type Variant = "default" | "secondary" | "outline" | "destructive" | "ghost";
type Size = "default" | "sm" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "ui-btn",
        `ui-btn-${variant}`,
        size === "sm" && "ui-btn-sm",
        size === "lg" && "ui-btn-lg",
        className,
      )}
      {...props}
    />
  );
}
