import { NpmPackageMetadata, PackageSearchResult } from "../types";

export interface INpmClient {
  /**
   * Fetch package metadata from npm registry
   * @throws PackageNotFoundError if package doesn't exist
   * @throws ExternalApiError if npm registry fails
   */
  fetchPackage(name: string, version?: string): Promise<NpmPackageMetadata>;

  /**
   * Search for packages by query
   */
  searchPackages(query: string, limit?: number): Promise<PackageSearchResult[]>;
}
