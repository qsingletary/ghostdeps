import {
  IHealthService,
  IPackageRepository,
  INpmsClient,
  ICache,
  CacheKeys,
  CacheTTL,
} from "../interfaces";
import {
  HealthScore,
  HealthLevel,
  HealthBreakdown,
  NpmPackageMetadata,
  NpmsPackageData,
} from "../types";

const WEIGHTS = {
  maintenance: 0.4,
  popularity: 0.2,
  activity: 0.2,
  security: 0.2,
} as const;

export class HealthService implements IHealthService {
  constructor(
    private readonly packageRepository: IPackageRepository,
    private readonly npmsClient: INpmsClient,
    private readonly cache: ICache,
  ) {}

  async calculate(name: string): Promise<HealthScore> {
    const cacheKey = CacheKeys.health(name);

    const cached = await this.cache.get<HealthScore>(cacheKey);
    if (cached) {
      return cached;
    }

    const [packageData, npmsData] = await Promise.all([
      this.packageRepository.findByName(name).catch(() => null),
      this.npmsClient.fetchScore(name),
    ]);

    const score = this.computeScore(packageData, npmsData);

    await this.cache.set(cacheKey, score, CacheTTL.HEALTH);

    return score;
  }

  async calculateBatch(names: string[]): Promise<Map<string, HealthScore>> {
    const results = new Map<string, HealthScore>();
    const uncached: string[] = [];

    for (const name of names) {
      const cached = await this.cache.get<HealthScore>(CacheKeys.health(name));
      if (cached) {
        results.set(name, cached);
      } else {
        uncached.push(name);
      }
    }

    if (uncached.length === 0) {
      return results;
    }

    const npmsDataMap = await this.npmsClient.fetchScoresBatch(uncached);

    await Promise.all(
      uncached.map(async (name) => {
        const packageData = await this.packageRepository
          .findByName(name)
          .catch(() => null);
        const npmsData = npmsDataMap.get(name) ?? this.emptyNpmsData();
        const score = this.computeScore(packageData, npmsData);

        await this.cache.set(CacheKeys.health(name), score, CacheTTL.HEALTH);
        results.set(name, score);
      }),
    );

    return results;
  }

  getLevel(score: number): HealthLevel {
    if (score >= 70) return "healthy";
    if (score >= 40) return "warning";
    if (score > 0) return "critical";
    return "unknown";
  }

  private computeScore(
    packageData: NpmPackageMetadata | null,
    npmsData: NpmsPackageData,
  ): HealthScore {
    const breakdown: HealthBreakdown = {
      maintenance: this.calcMaintenance(packageData),
      popularity: this.calcPopularity(npmsData),
      activity: this.calcActivity(npmsData),
      security: this.calcSecurity(npmsData),
    };

    const overall = Math.round(
      breakdown.maintenance * WEIGHTS.maintenance +
        breakdown.popularity * WEIGHTS.popularity +
        breakdown.activity * WEIGHTS.activity +
        breakdown.security * WEIGHTS.security,
    );

    return {
      overall,
      level: this.getLevel(overall),
      breakdown,
      vulnerabilities: npmsData.vulnerabilities,
      lastPublish: packageData?.time?.modified ?? "",
      weeklyDownloads: npmsData.downloads.weekly,
      openIssues: npmsData.github?.issues.openCount ?? 0,
      closedIssues:
        (npmsData.github?.issues.totalCount ?? 0) -
        (npmsData.github?.issues.openCount ?? 0),
    };
  }

  /**
   * Maintenance score based on days since last publish
   *
   * 0-30 days:   100
   * 30-90 days:  80-100
   * 90-180 days: 50-80
   * 180-365 days: 20-50
   * 365+ days:   0-20
   */
  private calcMaintenance(packageData: NpmPackageMetadata | null): number {
    if (!packageData?.time?.modified) {
      return 50; // Unknown = neutral
    }

    const modified = new Date(packageData.time.modified);
    const days = this.daysSince(modified);

    if (days <= 30) return 100;
    if (days <= 90) return Math.round(100 - ((days - 30) / 60) * 20);
    if (days <= 180) return Math.round(80 - ((days - 90) / 90) * 30);
    if (days <= 365) return Math.round(50 - ((days - 180) / 185) * 30);
    return Math.max(0, Math.round(20 - ((days - 365) / 365) * 20));
  }

  /**
   * Popularity score based on weekly downloads (log scale)
   *
   * 0:         0
   * 100:       20
   * 1,000:     40
   * 10,000:    60
   * 100,000:   80
   * 1,000,000: 100
   */
  private calcPopularity(npmsData: NpmsPackageData): number {
    const weekly = npmsData.downloads.weekly;

    if (weekly === 0) return 0;
    if (weekly < 10) return 10;

    const score = Math.log10(weekly) * 20;
    return Math.min(100, Math.round(score));
  }

  /**
   * Activity score based on GitHub issue resolution
   */
  private calcActivity(npmsData: NpmsPackageData): number {
    const github = npmsData.github;

    if (!github) {
      return Math.round(npmsData.maintenance * 100);
    }

    const total = github.issues.totalCount;
    const open = github.issues.openCount;

    if (total === 0) {
      return 50; // No issues = neutral
    }

    const closed = total - open;
    const ratio = closed / total;

    // Bonus for having issues (means people use it)
    const bonus = total > 10 ? 10 : 0;

    return Math.min(100, Math.round(ratio * 90 + bonus));
  }

  /**
   * Security score based on known vulnerabilities
   */
  private calcSecurity(npmsData: NpmsPackageData): number {
    const vulns = npmsData.vulnerabilities;

    if (vulns.length === 0) return 100;

    const penalties: Record<string, number> = {
      critical: 40,
      high: 25,
      moderate: 10,
      low: 5,
    };

    let score = 100;
    for (const v of vulns) {
      score -= penalties[v.severity] ?? 5;
    }

    return Math.max(0, score);
  }

  private daysSince(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private emptyNpmsData(): NpmsPackageData {
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
