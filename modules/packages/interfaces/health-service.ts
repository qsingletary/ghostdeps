import { HealthScore, HealthLevel } from "../types";

export interface IHealthService {
  /**
   * Calculate health score for a package
   */
  calculate(name: string): Promise<HealthScore>;

  /**
   * Calculate health scores for multiple packages
   */
  calculateBatch(names: string[]): Promise<Map<string, HealthScore>>;

  /**
   * Get health level from numeric score
   */
  getLevel(score: number): HealthLevel;
}
