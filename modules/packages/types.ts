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

// npms.io (external)
export interface NpmsPackageData {
  score: number;
  quality: number;
  popularity: number;
  maintenance: number;
  downloads: { weekly: number };
  github?: {
    issues: { openCount: number; totalCount: number };
  };
  vulnerabilities: Vulnerability[];
}

export interface Vulnerability {
  id: string;
  severity: "low" | "moderate" | "high" | "critical";
  title: string;
  url?: string;
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
}

export interface HealthScore {
  overall: number;
  level: HealthLevel;
  breakdown: HealthBreakdown;
  vulnerabilities: Vulnerability[];
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
