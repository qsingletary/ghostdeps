import { NpmsPackageData } from "../types";

export interface INpmsClient {
  /**
   * Fetch package score and analysis
   * Returns default empty data if package not found
   */
  fetchScore(name: string): Promise<NpmsPackageData>;

  /**
   * Fetch scores for multiple packages
   */
  fetchScoresBatch(names: string[]): Promise<Map<string, NpmsPackageData>>;
}
