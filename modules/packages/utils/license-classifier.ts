import type { LicenseCategory, LicenseInfo } from "../types";

/**
 * Classify an SPDX license string from a package.json into a compliance
 * category. The classifier is intentionally conservative: when an SPDX
 * expression mentions multiple licenses (e.g. "MIT OR GPL-3.0"), we return
 * the most restrictive category present, since downstream auditors need
 * to know that a copyleft option exists.
 *
 * @returns LicenseInfo with the original string and the worst-case category
 */
export function classifyLicense(license: string | undefined | null): LicenseInfo {
  const spdx = (license ?? "").trim();
  if (spdx === "" || /^unknown$/i.test(spdx)) {
    return { spdx, category: "unknown" };
  }

  const upper = spdx.toUpperCase();

  if (
    upper === "UNLICENSED" ||
    /\bSEE LICENSE\b/.test(upper) ||
    /\bCOMMERCIAL\b/.test(upper) ||
    /\bPROPRIETARY\b/.test(upper) ||
    /\bBUSL\b|\bBSL-1\.1\b|\bBUSINESS SOURCE\b/.test(upper)
  ) {
    return { spdx, category: "proprietary" };
  }

  if (/\b(AGPL|GPL|SSPL)(-?[0-9]|\b)/i.test(spdx) && !/\bLGPL/i.test(spdx)) {
    return { spdx, category: "strong-copyleft" };
  }
  if (/\b(AGPL|SSPL)\b/i.test(spdx)) {
    return { spdx, category: "strong-copyleft" };
  }

  if (/\b(LGPL|MPL|EPL|CDDL|CPL|EUPL|OSL|CECILL)(-?[0-9]|\b)/i.test(spdx)) {
    return { spdx, category: "weak-copyleft" };
  }

  if (matchesPermissive(spdx)) {
    return { spdx, category: "permissive" };
  }

  return { spdx, category: "unknown" };
}

const PERMISSIVE_PATTERNS = [
  /\bMIT\b/i,
  /\bISC\b/i,
  /\bAPACHE\b/i,
  /\bBSD\b/i,
  /\b0BSD\b/i,
  /\bUNLICENSE\b/i, // public domain (note: distinct from "UNLICENSED")
  /\bCC0\b/i,
  /\bWTFPL\b/i,
  /\bZLIB\b/i,
  /\bBLUEOAK\b/i,
  /\bPYTHON-2\.0\b/i,
  /\bX11\b/i,
];

function matchesPermissive(spdx: string): boolean {
  // Treat the literal "UNLICENSED" (no trailing E) as proprietary, but
  // "Unlicense" (the public-domain SPDX id) is permissive.
  if (/^UNLICENSED$/i.test(spdx.trim())) return false;
  return PERMISSIVE_PATTERNS.some((re) => re.test(spdx));
}

const CATEGORY_LABEL: Record<LicenseCategory, string> = {
  permissive: "Permissive",
  "weak-copyleft": "Weak copyleft",
  "strong-copyleft": "Strong copyleft",
  proprietary: "Proprietary",
  unknown: "Unknown",
};

export function categoryLabel(category: LicenseCategory): string {
  return CATEGORY_LABEL[category];
}

/**
 * Worst-case ranking, useful when summarising a tree: higher == riskier
 * for compliance audits.
 */
export function categoryRank(category: LicenseCategory): number {
  switch (category) {
    case "proprietary":
      return 5;
    case "strong-copyleft":
      return 4;
    case "unknown":
      return 3;
    case "weak-copyleft":
      return 2;
    case "permissive":
      return 1;
  }
}
