import { INpmsClient } from "../interfaces";
import { NpmsPackageData, Vulnerability } from "../types";

interface NpmsApiResponse {
  score?: { final?: number; detail?: { quality?: number; popularity?: number; maintenance?: number } };
  collected?: {
    npm?: { downloads?: Array<{ from: string; to: string; count: number }> };
    github?: { issues?: { openCount?: number; count?: number } };
    source?: { vulnerabilities?: Vulnerability[] };
  };
}

const NPMS_API = "https://api.npms.io/v2";

export class NpmsApiClient implements INpmsClient {
  async fetchScore(name: string): Promise<NpmsPackageData> {
    try {
      const encoded = encodeURIComponent(name);
      const response = await fetch(`${NPMS_API}/package/${encoded}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        // npms.io not having data is fine - return defaults
        return this.emptyData();
      }

      const data = await response.json();
      return this.mapResponse(data);
    } catch (error) {
      console.error(`[NpmsApiClient] Failed to fetch "${name}":`, error);
      return this.emptyData();
    }
  }

  async fetchScoresBatch(
    names: string[],
  ): Promise<Map<string, NpmsPackageData>> {
    const results = new Map<string, NpmsPackageData>();

    if (names.length === 0) {
      return results;
    }

    try {
      const batchSize = 250;

      for (let i = 0; i < names.length; i += batchSize) {
        const batch = names.slice(i, i + batchSize);

        const response = await fetch(`${NPMS_API}/package/mget`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(batch),
        });

        if (!response.ok) {
          // Fill batch with empty data on failure
          batch.forEach((name) => results.set(name, this.emptyData()));
          continue;
        }

        const data = await response.json();

        for (const name of batch) {
          if (data[name]) {
            results.set(name, this.mapResponse(data[name]));
          } else {
            results.set(name, this.emptyData());
          }
        }
      }
    } catch (error) {
      console.error("[NpmsApiClient] Batch fetch failed:", error);
      names.forEach((name) => {
        if (!results.has(name)) {
          results.set(name, this.emptyData());
        }
      });
    }

    return results;
  }

  /**
   * Map npms.io response to internal type
   */
  private mapResponse(data: NpmsApiResponse): NpmsPackageData {
    return {
      score: data.score?.final ?? 0,
      quality: data.score?.detail?.quality ?? 0,
      popularity: data.score?.detail?.popularity ?? 0,
      maintenance: data.score?.detail?.maintenance ?? 0,
      downloads: {
        weekly: this.sumWeeklyDownloads(data.collected?.npm?.downloads),
      },
      github: data.collected?.github
        ? {
            issues: {
              openCount: data.collected.github.issues?.openCount ?? 0,
              totalCount: data.collected.github.issues?.count ?? 0,
            },
          }
        : undefined,
      vulnerabilities: data.collected?.source?.vulnerabilities ?? [],
    };
  }

  /**
   * Sum downloads from the last 7 days
   */
  private sumWeeklyDownloads(
    downloads?: Array<{ from: string; to: string; count: number }>,
  ): number {
    if (!downloads || downloads.length === 0) return 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return downloads
      .filter((d) => new Date(d.from) >= oneWeekAgo)
      .reduce((sum, d) => sum + d.count, 0);
  }

  /**
   * Return empty/default data
   */
  private emptyData(): NpmsPackageData {
    return {
      score: 0,
      quality: 0,
      popularity: 0,
      maintenance: 0,
      downloads: { weekly: 0 },
      vulnerabilities: [],
    };
  }
}
