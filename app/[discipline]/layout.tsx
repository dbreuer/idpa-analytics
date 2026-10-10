import type { ReactNode } from "react";

import { disciplineDefinitions } from "@/lib/disciplines";

export const dynamicParams = false;

export function generateStaticParams() {
  return disciplineDefinitions.map((discipline) => ({ discipline: discipline.slug }));
}

export default function DisciplineLayout({ children }: { children: ReactNode }) {
  return children;
}
