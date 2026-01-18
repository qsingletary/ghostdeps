export type Severity = "low" | "moderate" | "high" | "critical";
export type HealthLevel = "healthy" | "warning" | "critical" | "unknown";

export interface Vulnerability {
  id: string;
  severity: Severity;
  title: string;
  url?: string;
}

export interface PackageHealth {
  overall: number;
  maintenance: number;
  popularity: number;
  activity: number;
  security: number;
  vulnerabilities: Vulnerability[];
  lastPublish: string;
  weeklyDownloads: number;
  openIssues: number;
  closedIssues: number;
}

export interface Package {
  name: string;
  version: string;
  description?: string;
  license?: string;
  homepage?: string;
  repository?: { type: string; url: string };
  maintainers?: Array<{ name: string; email?: string }>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface DependencyNode {
  name: string;
  version: string;
  depth: number;
  health: PackageHealth;
  healthLevel: HealthLevel;
  dependencies: DependencyNode[];
  parent?: string;
  circular?: boolean;
  error?: boolean;
}

export interface DependencyTree {
  root: DependencyNode;
  stats: {
    total: number;
    unique: number;
    maxDepth: number;
    byHealth: Record<HealthLevel, number>;
  };
  resolvedAt: string;
}

export interface GraphNode {
  name: string;
  version: string;
  health: PackageHealth;
  healthLevel: HealthLevel;
  root: boolean;
  expanded: boolean;
  dependencyCount: number;
}

// External API types
export interface NpmsResponse {
  score: {
    final: number;
    detail: { quality: number; popularity: number; maintenance: number };
  };
  collected: {
    metadata: { name: string; version: string; description?: string };
    npm: { downloads: Array<{ from: string; to: string; count: number }> };
    github?: { issues: { count: number; openCount: number } };
  };
}
