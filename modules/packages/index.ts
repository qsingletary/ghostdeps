export { container } from "./container";

export type {
  NpmPackageMetadata,
  NpmsPackageData,
  PackageSearchResult,
  Vulnerability,
  VulnerabilitySeverity,
  VulnerabilityReference,
  AffectedRange,
  BundleSize,
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
  IOsvClient,
  IBundleClient,
  IPackageRepository,
  IHealthService,
  IDependencyResolver,
} from "./interfaces";

export {
  parsePackageJson,
  type ParsedPackageJson,
  type ParseError,
  type ParseResult,
} from "./utils";
