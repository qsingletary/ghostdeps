import { BundleSize } from "../types";

export interface IBundleClient {
  /**
   * Fetch bundle-size metrics for a package@version. When `version` is
   * omitted or `"latest"`, Bundlephobia resolves the latest published
   * version. Returns `null` when the package has no analyzable bundle
   * (e.g. CLI-only tools) or the upstream API fails.
   */
  fetchBundleSize(name: string, version?: string): Promise<BundleSize | null>;

  /**
   * Fetch bundle metrics for many packages. Returns a Map keyed by package
   * name. Packages whose bundle data could not be retrieved map to `null`.
   */
  fetchBundleSizesBatch(
    packages: Array<{ name: string; version?: string }>,
  ): Promise<Map<string, BundleSize | null>>;
}
