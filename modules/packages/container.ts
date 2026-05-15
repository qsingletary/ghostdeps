import {
  ICache,
  INpmClient,
  INpmsClient,
  IOsvClient,
  IBundleClient,
  IPackageRepository,
  IHealthService,
  IDependencyResolver,
  ISupplyChainAnalyzer,
} from "./interfaces";

import {
  MemoryCache,
  RedisCache,
  NpmRegistryClient,
  NpmsApiClient,
  OsvClient,
  BundlephobiaClient,
} from "./adapters";
import { PackageRepository } from "./repositories";
import {
  HealthService,
  DependencyResolver,
  SupplyChainAnalyzer,
} from "./services";

/**
 * Lazy-initialized service container
 *
 * Services are created once on first access, then reused.
 * This is a simple singleton pattern without a DI framework.
 */
class Container {
  private cache: ICache | null = null;
  private npmClient: INpmClient | null = null;
  private npmsClient: INpmsClient | null = null;
  private osvClient: IOsvClient | null = null;
  private bundleClient: IBundleClient | null = null;
  private packageRepository: IPackageRepository | null = null;
  private healthService: IHealthService | null = null;
  private supplyChainAnalyzer: ISupplyChainAnalyzer | null = null;
  private dependencyResolver: IDependencyResolver | null = null;

  /**
   * Get or create cache adapter
   */
  getCache(): ICache {
    if (!this.cache) {
      this.cache = this.createCache();
    }
    return this.cache;
  }

  /**
   * Get or create npm client
   */
  getNpmClient(): INpmClient {
    if (!this.npmClient) {
      this.npmClient = new NpmRegistryClient();
    }
    return this.npmClient;
  }

  /**
   * Get or create npms client
   */
  getNpmsClient(): INpmsClient {
    if (!this.npmsClient) {
      this.npmsClient = new NpmsApiClient();
    }
    return this.npmsClient;
  }

  /**
   * Get or create OSV.dev vulnerability client
   */
  getOsvClient(): IOsvClient {
    if (!this.osvClient) {
      this.osvClient = new OsvClient();
    }
    return this.osvClient;
  }

  /**
   * Get or create Bundlephobia bundle-size client
   */
  getBundleClient(): IBundleClient {
    if (!this.bundleClient) {
      this.bundleClient = new BundlephobiaClient();
    }
    return this.bundleClient;
  }

  /**
   * Get or create package repository
   */
  getPackageRepository(): IPackageRepository {
    if (!this.packageRepository) {
      this.packageRepository = new PackageRepository(
        this.getCache(),
        this.getNpmClient(),
      );
    }
    return this.packageRepository;
  }

  /**
   * Get or create health service
   */
  getHealthService(): IHealthService {
    if (!this.healthService) {
      this.healthService = new HealthService(
        this.getPackageRepository(),
        this.getNpmsClient(),
        this.getOsvClient(),
        this.getBundleClient(),
        this.getCache(),
      );
    }
    return this.healthService;
  }

  /**
   * Get or create supply-chain analyzer
   */
  getSupplyChainAnalyzer(): ISupplyChainAnalyzer {
    if (!this.supplyChainAnalyzer) {
      this.supplyChainAnalyzer = new SupplyChainAnalyzer();
    }
    return this.supplyChainAnalyzer;
  }

  /**
   * Get or create dependency resolver
   */
  getDependencyResolver(): IDependencyResolver {
    if (!this.dependencyResolver) {
      this.dependencyResolver = new DependencyResolver(
        this.getPackageRepository(),
        this.getHealthService(),
        this.getSupplyChainAnalyzer(),
        this.getCache(),
      );
    }
    return this.dependencyResolver;
  }

  /**
   * Reset all services (useful for testing)
   */
  reset(): void {
    this.cache = null;
    this.npmClient = null;
    this.npmsClient = null;
    this.osvClient = null;
    this.bundleClient = null;
    this.packageRepository = null;
    this.healthService = null;
    this.supplyChainAnalyzer = null;
    this.dependencyResolver = null;
  }

  /**
   * Create appropriate cache based on environment
   */
  private createCache(): ICache {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken && process.env.DISABLE_CACHE !== "true") {
      console.log("[Container] Using Redis cache");
      return new RedisCache(redisUrl, redisToken);
    }

    console.log("[Container] Using in-memory cache");
    return new MemoryCache();
  }
}

export const container = new Container();
