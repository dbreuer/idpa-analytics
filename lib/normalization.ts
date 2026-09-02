import { slugify } from "@/lib/utils";

export function normalizeWhitespace(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

export function normalizeCompetitorName(value?: string | null) {
  const displayName = normalizeWhitespace(value);
  const normalizedName = slugify(displayName.replace(/\b(jr\.?|sr\.?)$/i, ""));
  return {
    displayName,
    normalizedName,
  };
}

export function normalizeClubName(
  value: string | undefined,
  aliases: Record<string, string>,
) {
  const raw = normalizeWhitespace(value);
  if (!raw) {
    return undefined;
  }

  return aliases[raw] ?? raw;
}

export function splitClubAndTeam(value?: string | null) {
  const raw = normalizeWhitespace(value);
  if (!raw) {
    return {};
  }

  const separatorMatch = raw.split(/\s*[\/|,-]\s*/).map((segment) => segment.trim()).filter(Boolean);
  if (separatorMatch.length >= 2) {
    return {
      club: separatorMatch[0],
      team: separatorMatch.slice(1).join(" / "),
    };
  }

  return {
    club: raw,
  };
}
