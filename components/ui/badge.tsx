import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center border-b-2 border-[var(--signal)] px-0 pb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]",
        className,
      )}
      {...props}
    />
  );
}
