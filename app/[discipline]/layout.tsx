import type { ReactNode } from "react";

import { getPublishedDisciplines } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedDisciplines().map((discipline) => ({ discipline: discipline.slug }));
}

export default function DisciplineLayout({ children }: { children: ReactNode }) {
  return children;
}
