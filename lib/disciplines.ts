import { mdlszDisciplines } from "@/lib/associations";

export const disciplineDefinitions = [
  {
    slug: "ipsc",
    name: "IPSC",
    aliases: ["IPSC", "International Practical Shooting Confederation"],
    published: true,
    analytics: "ipsc",
  },
  {
    slug: "imssu",
    name: "IMSSU",
    aliases: ["IMSSU", "International Metallic Silhouette Shooting Union"],
    published: true,
    analytics: "imssu",
  },
  {
    slug: "idpa",
    name: "IDPA",
    aliases: ["IDPA", "International Defensive Pistol Association"],
    published: true,
    analytics: "idpa",
  },
  {
    slug: "gyorskombinalt",
    name: "Gyorskombinált",
    aliases: ["Gyorskombinált", "Gyorskombinált és Precíziós"],
    published: true,
    analytics: "gyorskombinalt",
  },
  {
    slug: "steel-challenge",
    name: "Steel Challenge",
    aliases: ["Steel Challenge"],
    published: true,
    analytics: "steel-challenge",
  },
  {
    slug: "gyorspont-es-hazai-versenyszamok",
    name: "Gyorspont és hazai versenyszámok",
    aliases: ["Gyorspont és hazai versenyszámok", "Gyorspont"],
    published: false,
    analytics: "unsupported",
  },
  {
    slug: "iprf",
    name: "IPRF",
    aliases: ["IPRF", "International Precision Rifle Federation"],
    published: false,
    analytics: "unsupported",
  },
] as const;

export type Discipline = (typeof disciplineDefinitions)[number];
export type DisciplineSlug = Discipline["slug"];

export function isDisciplineSlug(value: string): value is DisciplineSlug {
  return disciplineDefinitions.some((discipline) => discipline.slug === value);
}

export function getDiscipline(value: string): Discipline | undefined {
  return disciplineDefinitions.find((discipline) => discipline.slug === value);
}

export function getPublishedDisciplines() {
  return disciplineDefinitions.filter((discipline) => discipline.published);
}

export function getDisciplineMark(slug: DisciplineSlug) {
  const discipline = getDiscipline(slug);
  if (!discipline) return undefined;
  return mdlszDisciplines.find((mark) => mark.name === discipline.name);
}
