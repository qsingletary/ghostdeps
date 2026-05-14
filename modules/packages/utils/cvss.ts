import type { VulnerabilitySeverity } from "../types";

/**
 * Severity bucket from a CVSS v3.x base score.
 *
 * Thresholds per FIRST.org / NVD:
 *   0.0       → none/unknown
 *   0.1–3.9   → low
 *   4.0–6.9   → moderate (NVD calls this "medium")
 *   7.0–8.9   → high
 *   9.0–10.0  → critical
 */
export function severityFromScore(score: number): VulnerabilitySeverity {
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "moderate";
  return "low";
}

/**
 * Map a GHSA-style severity string (LOW / MODERATE / HIGH / CRITICAL,
 * case-insensitive) to our internal `VulnerabilitySeverity`. Returns
 * `null` when the string is not a recognized severity.
 */
export function severityFromGhsaString(
  value: string | undefined,
): VulnerabilitySeverity | null {
  if (!value) return null;
  switch (value.toUpperCase()) {
    case "CRITICAL":
      return "critical";
    case "HIGH":
      return "high";
    case "MODERATE":
    case "MEDIUM":
      return "moderate";
    case "LOW":
      return "low";
    default:
      return null;
  }
}

const METRIC_AV: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const METRIC_AC: Record<string, number> = { L: 0.77, H: 0.44 };
const METRIC_PR_UNCHANGED: Record<string, number> = {
  N: 0.85,
  L: 0.62,
  H: 0.27,
};
const METRIC_PR_CHANGED: Record<string, number> = { N: 0.85, L: 0.68, H: 0.5 };
const METRIC_UI: Record<string, number> = { N: 0.85, R: 0.62 };
const METRIC_CIA: Record<string, number> = { N: 0, L: 0.22, H: 0.56 };

export interface ParsedCvssV3 {
  baseScore: number;
  severity: VulnerabilitySeverity;
}

interface CvssMetrics {
  AV: string;
  AC: string;
  PR: string;
  UI: string;
  S: string;
  C: string;
  I: string;
  A: string;
}

/**
 * Parse a CVSS v3 vector string (e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")
 * and compute the base score per the CVSS v3.1 specification.
 *
 * Returns `null` if the vector is malformed or missing required metrics.
 */
export function parseCvssV3(vector: string): ParsedCvssV3 | null {
  if (!vector || typeof vector !== "string") return null;

  const metrics = parseMetrics(vector);
  if (!metrics) return null;

  const av = METRIC_AV[metrics.AV];
  const ac = METRIC_AC[metrics.AC];
  const ui = METRIC_UI[metrics.UI];
  const c = METRIC_CIA[metrics.C];
  const i = METRIC_CIA[metrics.I];
  const a = METRIC_CIA[metrics.A];

  if (
    av === undefined ||
    ac === undefined ||
    ui === undefined ||
    c === undefined ||
    i === undefined ||
    a === undefined
  ) {
    return null;
  }

  const scopeChanged = metrics.S === "C";
  const prTable = scopeChanged ? METRIC_PR_CHANGED : METRIC_PR_UNCHANGED;
  const pr = prTable[metrics.PR];
  if (pr === undefined) return null;

  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  const impact = scopeChanged
    ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
    : 6.42 * iss;
  const exploitability = 8.22 * av * ac * pr * ui;

  let baseScore: number;
  if (impact <= 0) {
    baseScore = 0;
  } else if (scopeChanged) {
    baseScore = roundUp(Math.min(1.08 * (impact + exploitability), 10));
  } else {
    baseScore = roundUp(Math.min(impact + exploitability, 10));
  }

  return { baseScore, severity: severityFromScore(baseScore) };
}

function parseMetrics(vector: string): CvssMetrics | null {
  const trimmed = vector.trim();
  if (!trimmed.startsWith("CVSS:3")) return null;

  const parts = trimmed.split("/").slice(1);
  const out: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split(":");
    if (!key || !value) return null;
    out[key] = value;
  }

  for (const required of ["AV", "AC", "PR", "UI", "S", "C", "I", "A"]) {
    if (!(required in out)) return null;
  }

  return out as unknown as CvssMetrics;
}

/**
 * CVSS v3.1 Roundup function — rounds to the nearest tenth, always rounding
 * up when there is any sub-tenth fraction.
 */
function roundUp(num: number): number {
  const int = Math.round(num * 100000);
  if (int % 10000 === 0) return int / 100000;
  return (Math.floor(int / 10000) + 1) / 10;
}
