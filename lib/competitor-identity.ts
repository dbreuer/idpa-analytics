import type { CompetitionResult } from "@/lib/types";

/**
 * Links records by a numeric competitor licence ("V.eng.") when the source provides one,
 * otherwise by normalised name. Name- and licence-keyed records are never bridged.
 */
export function sourceCompetitorKey(result: Pick<CompetitionResult, "competitorLicenseId" | "rawRow" | "normalizedCompetitorName" | "competitorName">) {
  const sourceLicense = Object.entries(result.rawRow ?? {})
    .find(([header]) => header.replace(/\s/g, "").toLowerCase() === "v.eng.")?.[1];
  const license = result.competitorLicenseId || sourceLicense?.trim();
  if (license && /^\d+$/.test(license) && /[1-9]/.test(license)) {
    return `license:${license.replace(/^0+/, "")}`;
  }
  return `name:${result.normalizedCompetitorName || result.competitorName.trim()}`;
}
