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
  LicenseCategory,
  LicenseInfo,
  SupplyChainWarning,
  WarningKind,
  WarningSeverity,
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
  ISupplyChainAnalyzer,
} from "./interfaces";

export {
  parsePackageJson,
  type ParsedPackageJson,
  type ParseError,
  type ParseResult,
  classifyLicense,
  categoryLabel,
  categoryRank,
} from "./utils";
