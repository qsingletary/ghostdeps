import { Vulnerability } from "../types";

export interface IOsvClient {
  /**
   * Fetch known vulnerabilities for a single package, optionally filtered by
   * a specific resolved version. When `version` is omitted, all known vulns
   * for the package are returned regardless of affected range.
   */
  fetchVulnerabilities(
    name: string,
    version?: string,
  ): Promise<Vulnerability[]>;

  /**
   * Fetch vulnerabilities for many packages in one request. Each entry may
   * specify a version for version-aware filtering. Returns a Map keyed by
   * package name; packages with no known vulns map to an empty array.
   */
  fetchVulnerabilitiesBatch(
    packages: Array<{ name: string; version?: string }>,
  ): Promise<Map<string, Vulnerability[]>>;
}
