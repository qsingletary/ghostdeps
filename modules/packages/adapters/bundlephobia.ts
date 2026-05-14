import { IBundleClient } from "../interfaces";
import { BundleSize } from "../types";

const BUNDLEPHOBIA_API = "https://bundlephobia.com/api/size";
const USER_AGENT = "ghostdeps (https://github.com/qsingletary/ghostdeps)";
const BATCH_CONCURRENCY = 6;

interface BundlephobiaRaw {
  size?: number;
  gzip?: number;
  dependencyCount?: number;
  hasJSModule?: string | false;
  hasSideEffects?: boolean;
  isModuleType?: boolean;
}

export class BundlephobiaClient implements IBundleClient {
  async fetchBundleSize(
    name: string,
    version?: string,
  ): Promise<BundleSize | null> {
    try {
      const pkg = version && version !== "latest" ? `${name}@${version}` : name;
      const url = `${BUNDLEPHOBIA_API}?package=${encodeURIComponent(pkg)}`;

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
          "X-Bundlephobia-User-Agent": USER_AGENT,
        },
      });

      if (!response.ok) return null;

      const data = (await response.json()) as BundlephobiaRaw;
      return mapResponse(data);
    } catch (error) {
      console.error(`[BundlephobiaClient] fetch failed for "${name}":`, error);
      return null;
    }
  }

  async fetchBundleSizesBatch(
    packages: Array<{ name: string; version?: string }>,
  ): Promise<Map<string, BundleSize | null>> {
    const results = new Map<string, BundleSize | null>();
    if (packages.length === 0) return results;

    for (let i = 0; i < packages.length; i += BATCH_CONCURRENCY) {
      const chunk = packages.slice(i, i + BATCH_CONCURRENCY);
      const fetched = await Promise.all(
        chunk.map((p) => this.fetchBundleSize(p.name, p.version)),
      );
      for (let j = 0; j < chunk.length; j++) {
        const pkg = chunk[j];
        if (pkg) results.set(pkg.name, fetched[j] ?? null);
      }
    }

    return results;
  }
}

function mapResponse(data: BundlephobiaRaw): BundleSize | null {
  if (typeof data.size !== "number" || typeof data.gzip !== "number") {
    return null;
  }

  return {
    minified: data.size,
    gzipped: data.gzip,
    dependencyCount: data.dependencyCount ?? 0,
    hasJSModule: Boolean(data.hasJSModule),
    hasSideEffects: data.hasSideEffects ?? true,
    isModuleType: data.isModuleType ?? false,
  };
}
