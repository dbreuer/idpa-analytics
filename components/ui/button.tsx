import * as React from "react";

import { cn } from "@/lib/utils";

export function Button({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--signal-dark)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
