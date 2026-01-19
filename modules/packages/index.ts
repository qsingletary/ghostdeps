export { container } from "./container";

export type {
  NpmPackageMetadata,
  NpmsPackageData,
  PackageSearchResult,
  Vulnerability,
  HealthLevel,
  HealthBreakdown,
  HealthScore,
  DependencyNode,
  DependencyTree,
  TreeStats,
} from "./types";

export {
  PackageError,
  PackageNotFoundError,
  ResolutionError,
  ExternalApiError,
} from "./errors";

export type {
  ICache,
  INpmClient,
  INpmsClient,
  IPackageRepository,
  IHealthService,
  IDependencyResolver,
} from "./interfaces";
