export const dashboardSections = [
  { id: "overview", label: "Áttekintés" },
  { id: "rankings", label: "Rangsorok" },
  { id: "analytics", label: "Statisztikák" },
  { id: "details", label: "Részletek" },
  { id: "competitions", label: "Versenyek" },
  { id: "insights", label: "Szezonkiemelések" },
  { id: "data-quality", label: "Adatminőség" },
] as const;

export type DashboardSectionId = (typeof dashboardSections)[number]["id"];

export function isDashboardSectionId(value: string): value is DashboardSectionId {
  return dashboardSections.some((section) => section.id === value);
}
