import { IOsvClient } from "../interfaces";
import {
  Vulnerability,
  AffectedRange,
  VulnerabilityReference,
  VulnerabilitySeverity,
} from "../types";
import {
  parseCvssV3,
  severityFromGhsaString,
} from "../utils/cvss";

const OSV_API = "https://api.osv.dev";
const ECOSYSTEM = "npm";

interface OsvVulnRaw {
  id: string;
  aliases?: string[];
  summary?: string;
  details?: string;
  published?: string;
  modified?: string;
  severity?: Array<{ type: string; score: string }>;
  affected?: Array<{
    package?: { name?: string; ecosystem?: string };
    ranges?: Array<{
      type?: string;
      events?: Array<{ introduced?: string; fixed?: string }>;
    }>;
  }>;
  references?: Array<{ type?: string; url?: string }>;
  database_specific?: { severity?: string };
}

interface OsvQueryResponse {
  vulns?: OsvVulnRaw[];
}

interface OsvBatchResponse {
  results?: Array<{ vulns?: Array<{ id: string }> }>;
}

export class OsvClient implements IOsvClient {
  async fetchVulnerabilities(
    name: string,
    version?: string,
  ): Promise<Vulnerability[]> {
    try {
      const body: Record<string, unknown> = {
        package: { name, ecosystem: ECOSYSTEM },
      };
      if (version && version !== "latest") {
        body.version = version;
      }

      const response = await fetch(`${OSV_API}/v1/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) return [];

      const data = (await response.json()) as OsvQueryResponse;
      return (data.vulns ?? []).map((v) => mapVuln(v, name));
    } catch (error) {
      console.error(`[OsvClient] fetchVulnerabilities("${name}") failed:`, error);
      return [];
    }
  }

  async fetchVulnerabilitiesBatch(
    packages: Array<{ name: string; version?: string }>,
  ): Promise<Map<string, Vulnerability[]>> {
    const results = new Map<string, Vulnerability[]>();
    if (packages.length === 0) return results;

    for (const pkg of packages) {
      results.set(pkg.name, []);
    }

    try {
      const queries = packages.map((pkg) => {
        const q: Record<string, unknown> = {
          package: { name: pkg.name, ecosystem: ECOSYSTEM },
        };
        if (pkg.version && pkg.version !== "latest") {
          q.version = pkg.version;
        }
        return q;
      });

      const response = await fetch(`${OSV_API}/v1/querybatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ queries }),
      });

      if (!response.ok) return results;

      const batch = (await response.json()) as OsvBatchResponse;
      const batchResults = batch.results ?? [];

      const idsByPackage = new Map<string, string[]>();
      const allIds = new Set<string>();

      packages.forEach((pkg, i) => {
        const ids = (batchResults[i]?.vulns ?? []).map((v) => v.id);
        idsByPackage.set(pkg.name, ids);
        ids.forEach((id) => allIds.add(id));
      });

      if (allIds.size === 0) return results;

      const details = await this.fetchVulnDetailsBulk(Array.from(allIds));

      for (const pkg of packages) {
        const ids = idsByPackage.get(pkg.name) ?? [];
        const vulns: Vulnerability[] = [];
        for (const id of ids) {
          const raw = details.get(id);
          if (raw) vulns.push(mapVuln(raw, pkg.name));
        }
        results.set(pkg.name, vulns);
      }

      return results;
    } catch (error) {
      console.error("[OsvClient] fetchVulnerabilitiesBatch failed:", error);
      return results;
    }
  }

  /**
   * Fetch full vulnerability records for a list of IDs. Returns a Map of
   * id → raw vuln object. Failures for individual IDs are silently dropped.
   */
  private async fetchVulnDetailsBulk(
    ids: string[],
  ): Promise<Map<string, OsvVulnRaw>> {
    const details = new Map<string, OsvVulnRaw>();
    const CONCURRENCY = 10;

    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const batch = ids.slice(i, i + CONCURRENCY);
      const fetched = await Promise.all(
        batch.map((id) => this.fetchVulnDetail(id)),
      );
      for (let j = 0; j < batch.length; j++) {
        const id = batch[j];
        const vuln = fetched[j];
        if (id && vuln) details.set(id, vuln);
      }
    }

    return details;
  }

  private async fetchVulnDetail(id: string): Promise<OsvVulnRaw | null> {
    try {
      const response = await fetch(`${OSV_API}/v1/vulns/${encodeURIComponent(id)}`);
      if (!response.ok) return null;
      return (await response.json()) as OsvVulnRaw;
    } catch {
      return null;
    }
  }
}

function mapVuln(raw: OsvVulnRaw, packageName: string): Vulnerability {
  const cvss = extractCvss(raw.severity);
  const severity = resolveSeverity(raw, cvss?.severity);

  const affectedForThisPackage = (raw.affected ?? []).filter(
    (a) =>
      a.package?.ecosystem === ECOSYSTEM &&
      a.package?.name?.toLowerCase() === packageName.toLowerCase(),
  );

  const affectedRanges: AffectedRange[] = [];
  const patchedVersions = new Set<string>();

  for (const aff of affectedForThisPackage) {
    for (const range of aff.ranges ?? []) {
      let introduced: string | undefined;
      for (const event of range.events ?? []) {
        if (event.introduced !== undefined) {
          introduced = event.introduced;
        }
        if (event.fixed !== undefined) {
          patchedVersions.add(event.fixed);
          affectedRanges.push({
            introduced: introduced ?? "0",
            fixed: event.fixed,
          });
          introduced = undefined;
        }
      }
      if (introduced !== undefined) {
        affectedRanges.push({ introduced });
      }
    }
  }

  const references: VulnerabilityReference[] = (raw.references ?? [])
    .filter((r): r is { type: string; url: string } => !!r.url)
    .map((r) => ({ type: r.type ?? "WEB", url: r.url }));

  return {
    id: raw.id,
    aliases: raw.aliases ?? [],
    summary: raw.summary ?? raw.id,
    details: raw.details,
    severity,
    cvssScore: cvss?.score,
    cvssVector: cvss?.vector,
    affectedRanges,
    patchedVersions: Array.from(patchedVersions),
    references,
    published: raw.published,
    modified: raw.modified,
  };
}

function extractCvss(
  entries: OsvVulnRaw["severity"],
):
  | { score?: number; vector: string; severity: VulnerabilitySeverity }
  | undefined {
  if (!entries || entries.length === 0) return undefined;
  const cvssEntry = entries.find((e) =>
    e.type?.toUpperCase().startsWith("CVSS_V3"),
  );
  if (!cvssEntry) return undefined;

  const parsed = parseCvssV3(cvssEntry.score);
  if (!parsed) return undefined;
  return {
    score: parsed.baseScore,
    vector: cvssEntry.score,
    severity: parsed.severity,
  };
}

function resolveSeverity(
  raw: OsvVulnRaw,
  fromCvss: VulnerabilitySeverity | undefined,
): VulnerabilitySeverity {
  const fromDb = severityFromGhsaString(raw.database_specific?.severity);
  if (fromDb) return fromDb;
  if (fromCvss) return fromCvss;
  return "moderate";
}
