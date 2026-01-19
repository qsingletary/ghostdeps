import { NpmPackageMetadata, PackageSearchResult } from "../types";

export interface IPackageRepository {
  /**
   * Find package by name and version
   * @throws PackageNotFoundError if not found
   */
  findByName(name: string, version?: string): Promise<NpmPackageMetadata>;

  /**
   * Search packages by query
   */
  search(query: string, limit?: number): Promise<PackageSearchResult[]>;
}
