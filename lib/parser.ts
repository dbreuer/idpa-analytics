import type { ParsedNotes } from "@/lib/types";

const LICENSE_PATTERN = /([A-Z]{2}\d{4,})/i;
const NUMBER_PATTERN = /(\d+[,.]\d+|\d+)/;

export function parseNotes(value?: string | null): ParsedNotes {
  if (!value || !value.trim()) {
    return {};
  }

  const rawNotes = value.trim();
  const licenseMatch = rawNotes.match(LICENSE_PATTERN);
  const numericMatches = rawNotes.match(new RegExp(NUMBER_PATTERN, "g")) ?? [];

  const parsed: ParsedNotes = { rawNotes };

  if (licenseMatch) {
    parsed.competitionLicenseId = licenseMatch[1].toUpperCase();
  }

  const timeCandidate = numericMatches.find((candidate) => candidate !== parsed.competitionLicenseId);
  if (timeCandidate) {
    const normalizedTime = Number.parseFloat(timeCandidate.replace(",", "."));
    if (!Number.isNaN(normalizedTime)) {
      parsed.timeSeconds = normalizedTime;
    }
  }

  if (!parsed.competitionLicenseId && parsed.timeSeconds === undefined) {
    parsed.parseError = true;
  }

  return parsed;
}
