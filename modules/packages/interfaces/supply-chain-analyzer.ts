import { NpmPackageMetadata, SupplyChainWarning } from "../types";

export interface AnalyzeInput {
  name: string;
  metadata: NpmPackageMetadata | null;
  weeklyDownloads: number;
}

export interface ISupplyChainAnalyzer {
  /**
   * Inspect a package for supply-chain red flags. Returns an empty array
   * when nothing suspicious is detected.
   *
   * Signals currently surfaced:
   * - new-popularity: published <7 days ago but already getting traction
   * - single-maintainer-new: solo author + freshly published
   * - typosquat: name is Levenshtein-close to a known popular package
   */
  analyze(input: AnalyzeInput): SupplyChainWarning[];
}
