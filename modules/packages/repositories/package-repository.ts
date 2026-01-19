import {
  IPackageRepository,
  ICache,
  INpmClient,
  CacheKeys,
  CacheTTL,
} from "../interfaces";
import { NpmPackageMetadata, PackageSearchResult } from "../types";

export class PackageRepository implements IPackageRepository {
  constructor(
    private readonly cache: ICache,
    private readonly npmClient: INpmClient,
  ) {}

  async findByName(
    name: string,
    version: string = "latest",
  ): Promise<NpmPackageMetadata> {
    const cacheKey = CacheKeys.package(name, version);

    const cached = await this.cache.get<NpmPackageMetadata>(cacheKey);
    if (cached) {
      return cached;
    }

    const metadata = await this.npmClient.fetchPackage(name, version);

    await this.cache.set(cacheKey, metadata, CacheTTL.PACKAGE);

    return metadata;
  }

  async search(
    query: string,
    limit: number = 10,
  ): Promise<PackageSearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const cacheKey = CacheKeys.search(query);

    const cached = await this.cache.get<PackageSearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const results = await this.npmClient.searchPackages(query, limit);

    await this.cache.set(cacheKey, results, CacheTTL.SEARCH);

    return results;
  }
}
