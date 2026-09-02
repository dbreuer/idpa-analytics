import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100",
        className,
      )}
      {...props}
    />
  );
}
