// npm registry (external)
export interface NpmPackageMetadata {
  name: string;
  version: string;
  description?: string;
  license?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  repository?: { type: string; url: string };
  time?: { created: string; modified: string; [version: string]: string };
  maintainers?: Array<{ name: string; email?: string }>;
}

// npms.io (external) — used for popularity + GitHub issue signals.
// Vulnerability data is sourced from OSV.dev instead and lives on HealthScore.
export interface NpmsPackageData {
  score: number;
  quality: number;
  popularity: number;
  maintenance: number;
  downloads: { weekly: number };
  github?: {
    issues: { openCount: number; totalCount: number };
  };
}

export type VulnerabilitySeverity = "low" | "moderate" | "high" | "critical";

export interface AffectedRange {
  introduced: string;
  fixed?: string;
}

export interface VulnerabilityReference {
  type: string;
  url: string;
}

export interface BundleSize {
  minified: number;
  gzipped: number;
  dependencyCount: number;
  hasJSModule: boolean;
  hasSideEffects: boolean;
  isModuleType: boolean;
}

export type LicenseCategory =
  | "permissive"
  | "weak-copyleft"
  | "strong-copyleft"
  | "proprietary"
  | "unknown";

export interface LicenseInfo {
  spdx: string;
  category: LicenseCategory;
}

export interface Vulnerability {
  id: string;
  aliases: string[];
  summary: string;
  details?: string;
  severity: VulnerabilitySeverity;
  cvssScore?: number;
  cvssVector?: string;
  affectedRanges: AffectedRange[];
  patchedVersions: string[];
  references: VulnerabilityReference[];
  published?: string;
  modified?: string;
}

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  score: number;
}

export type HealthLevel = "healthy" | "warning" | "critical" | "unknown";

export interface HealthBreakdown {
  maintenance: number;
  popularity: number;
  activity: number;
  security: number;
  size: number;
}

export interface HealthScore {
  overall: number;
  level: HealthLevel;
  breakdown: HealthBreakdown;
  vulnerabilities: Vulnerability[];
  bundle: BundleSize | null;
  license: LicenseInfo;
  lastPublish: string;
  weeklyDownloads: number;
  openIssues: number;
  closedIssues: number;
}

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  health: HealthScore;
  depth: number;
  dependencies: DependencyNode[];
  parent?: string;
  isCircular?: boolean;
  hasError?: boolean;
}

export interface DependencyTree {
  root: DependencyNode;
  stats: TreeStats;
  resolvedAt: string;
}

export interface TreeStats {
  totalPackages: number;
  uniquePackages: number;
  maxDepth: number;
  healthDistribution: Record<HealthLevel, number>;
}
