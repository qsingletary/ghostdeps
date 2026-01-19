import { INpmClient } from "../interfaces";
import { NpmPackageMetadata, PackageSearchResult } from "../types";
import { PackageNotFoundError, ExternalApiError } from "../errors";

interface NpmSearchObject {
  package: { name: string; version: string; description?: string };
  score: { final: number };
}

interface NpmRegistryDocument {
  "dist-tags"?: Record<string, string>;
  versions?: Record<string, NpmPackageMetadata>;
  time?: { created: string; modified: string; [version: string]: string };
  maintainers?: Array<{ name: string; email?: string }>;
}

const NPM_REGISTRY = "https://registry.npmjs.org";

export class NpmRegistryClient implements INpmClient {
  async fetchPackage(
    name: string,
    version: string = "latest",
  ): Promise<NpmPackageMetadata> {
    const encodedName = this.encodeName(name);

    const response = await fetch(`${NPM_REGISTRY}/${encodedName}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new PackageNotFoundError(name, version);
      }
      throw new ExternalApiError("npm registry", response.status);
    }

    const data = await response.json();
    return this.extractVersion(data, name, version);
  }

  async searchPackages(
    query: string,
    limit: number = 10,
  ): Promise<PackageSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const url = `${NPM_REGISTRY}/-/v1/search?text=${encodeURIComponent(query)}&size=${limit}`;

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new ExternalApiError("npm search", response.status);
    }

    const data = await response.json();

    return data.objects.map((obj: NpmSearchObject) => ({
      name: obj.package.name,
      version: obj.package.version,
      description: obj.package.description || "",
      score: obj.score.final,
    }));
  }

  /**
   * Encode package name for URL (handles scoped packages like @org/pkg)
   */
  private encodeName(name: string): string {
    return encodeURIComponent(name).replace("%40", "@");
  }

  /**
   * Extract specific version from full package document
   */
  private extractVersion(
    data: NpmRegistryDocument,
    name: string,
    version: string,
  ): NpmPackageMetadata {
    // Resolve version tag (latest, next, beta, etc.)
    let resolvedVersion = version;

    if (data["dist-tags"]?.[version]) {
      resolvedVersion = data["dist-tags"][version];
    } else if (version === "latest" && data["dist-tags"]?.latest) {
      resolvedVersion = data["dist-tags"].latest;
    }

    const versionData = data.versions?.[resolvedVersion];

    if (!versionData) {
      throw new PackageNotFoundError(name, version);
    }

    return {
      name: versionData.name,
      version: versionData.version,
      description: versionData.description,
      license: versionData.license,
      dependencies: versionData.dependencies || {},
      devDependencies: versionData.devDependencies || {},
      repository: versionData.repository,
      time: data.time,
      maintainers: data.maintainers,
    };
  }
}
