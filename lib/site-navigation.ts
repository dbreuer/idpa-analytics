export const dashboardSections = [
  { id: "overview", label: "Overview" },
  { id: "rankings", label: "Rankings" },
  { id: "analytics", label: "Analytics" },
  { id: "details", label: "Details" },
  { id: "competitions", label: "Competitions" },
  { id: "insights", label: "Insights" },
  { id: "data-quality", label: "Data quality" },
] as const;

export type DashboardSectionId = (typeof dashboardSections)[number]["id"];

export function isDashboardSectionId(value: string): value is DashboardSectionId {
  return dashboardSections.some((section) => section.id === value);
}
