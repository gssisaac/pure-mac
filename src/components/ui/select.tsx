import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="ui-select-wrap">
        <select ref={ref} className={cn("ui-select", className)} {...props}>
          {children}
        </select>
      </div>
    );
  },
);

Select.displayName = "Select";
