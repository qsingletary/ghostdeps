import { HealthScore, HealthLevel } from "../types";

export interface IHealthService {
  /**
   * Calculate health score for a package, optionally pinned to a specific
   * resolved version so vulnerability filtering is version-aware.
   */
  calculate(name: string, version?: string): Promise<HealthScore>;

  /**
   * Calculate health scores for multiple packages
   */
  calculateBatch(names: string[]): Promise<Map<string, HealthScore>>;

  /**
   * Get health level from numeric score
   */
  getLevel(score: number): HealthLevel;
}
