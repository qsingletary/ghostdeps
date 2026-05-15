import {
  AnalyzeInput,
  ISupplyChainAnalyzer,
} from "../interfaces/supply-chain-analyzer";
import { SupplyChainWarning } from "../types";
import { levenshtein } from "../utils/levenshtein";
import popularPackagesJson from "../data/popular-npm-packages.json";

const DEFAULT_POPULAR: ReadonlySet<string> = new Set(
  (popularPackagesJson as string[]).map((n) => n.toLowerCase()),
);

const NEW_POPULARITY_DAYS = 7;
const NEW_POPULARITY_DOWNLOADS = 1_000;
const SINGLE_MAINTAINER_DAYS = 30;
const TYPOSQUAT_MAX_DISTANCE = 2;

export class SupplyChainAnalyzer implements ISupplyChainAnalyzer {
  constructor(
    private readonly popularPackages: ReadonlySet<string> = DEFAULT_POPULAR,
  ) {}

  analyze(input: AnalyzeInput): SupplyChainWarning[] {
    const warnings: SupplyChainWarning[] = [];

    const createdDays = this.daysSinceCreated(input.metadata);

    if (
      createdDays !== null &&
      createdDays < NEW_POPULARITY_DAYS &&
      input.weeklyDownloads > NEW_POPULARITY_DOWNLOADS
    ) {
      warnings.push({
        kind: "new-popularity",
        severity: "moderate",
        message: `Published ${createdDays}d ago with ${input.weeklyDownloads.toLocaleString()} weekly downloads — unusual traction for a brand-new package.`,
        details: {
          createdDaysAgo: createdDays,
          weeklyDownloads: input.weeklyDownloads,
        },
      });
    }

    const maintainerCount = input.metadata?.maintainers?.length ?? 0;
    if (
      maintainerCount === 1 &&
      createdDays !== null &&
      createdDays < SINGLE_MAINTAINER_DAYS
    ) {
      warnings.push({
        kind: "single-maintainer-new",
        severity: "low",
        message: `Single maintainer on a ${createdDays}-day-old package — limited eyes on the code.`,
        details: { createdDaysAgo: createdDays, maintainers: 1 },
      });
    }

    const typosquat = this.findTyposquatTarget(input.name);
    if (typosquat) {
      warnings.push({
        kind: "typosquat",
        severity: "high",
        message: `Name is ${typosquat.distance} character${
          typosquat.distance === 1 ? "" : "s"
        } away from "${typosquat.target}" — verify you didn't mistype it.`,
        details: { similarTo: typosquat.target, distance: typosquat.distance },
      });
    }

    return warnings;
  }

  private daysSinceCreated(
    metadata: AnalyzeInput["metadata"],
  ): number | null {
    const created = metadata?.time?.created;
    if (!created) return null;
    const ms = Date.now() - new Date(created).getTime();
    if (Number.isNaN(ms)) return null;
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  private findTyposquatTarget(
    name: string,
  ): { target: string; distance: number } | null {
    const lower = name.toLowerCase();
    if (this.popularPackages.has(lower)) return null;

    let best: { target: string; distance: number } | null = null;

    for (const candidate of this.popularPackages) {
      if (Math.abs(candidate.length - lower.length) > TYPOSQUAT_MAX_DISTANCE) {
        continue;
      }
      const d = levenshtein(lower, candidate, TYPOSQUAT_MAX_DISTANCE);
      if (d > 0 && d <= TYPOSQUAT_MAX_DISTANCE) {
        if (!best || d < best.distance) {
          best = { target: candidate, distance: d };
          if (d === 1) break;
        }
      }
    }

    return best;
  }
}
