import type { ReactNode } from "react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface SectionChartProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SectionChart({ title, description, children }: SectionChartProps) {
  return (
    <Card className="h-full">
      <div className="mb-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="h-[280px] min-w-0 md:h-[320px]">{children}</div>
    </Card>
  );
}
