import {
  IDependencyResolver,
  IPackageRepository,
  IHealthService,
  ICache,
  CacheKeys,
  CacheTTL,
} from "../interfaces";
import {
  DependencyTree,
  DependencyNode,
  TreeStats,
  HealthScore,
  HealthLevel,
} from "../types";

const DEFAULT_MAX_DEPTH = 5;
const MAX_DEPTH_LIMIT = 10;
const CONCURRENCY_LIMIT = 10;

export class DependencyResolver implements IDependencyResolver {
  private resolved = new Map<string, DependencyNode>();
  private inProgress = new Set<string>();

  constructor(
    private readonly packageRepository: IPackageRepository,
    private readonly healthService: IHealthService,
    private readonly cache: ICache,
  ) {}

  async resolve(
    name: string,
    version: string = "latest",
    maxDepth: number = DEFAULT_MAX_DEPTH,
  ): Promise<DependencyTree> {
    const depth = Math.min(Math.max(1, maxDepth), MAX_DEPTH_LIMIT);
    const cacheKey = CacheKeys.tree(name, version, depth);

    const cached = await this.cache.get<DependencyTree>(cacheKey);
    if (cached) {
      return cached;
    }

    this.resolved.clear();
    this.inProgress.clear();

    const root = await this.resolveNode(name, version, 0, depth);
    const stats = this.calculateStats(root);

    const tree: DependencyTree = {
      root,
      stats,
      resolvedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, tree, CacheTTL.TREE);

    return tree;
  }

  private async resolveNode(
    name: string,
    version: string,
    depth: number,
    maxDepth: number,
    parent?: string,
  ): Promise<DependencyNode> {
    try {
      const metadata = await this.packageRepository.findByName(name, version);
      const nodeId = `${metadata.name}@${metadata.version}`;

      const existing = this.resolved.get(nodeId);
      if (existing) {
        return { ...existing, parent };
      }

      if (this.inProgress.has(nodeId)) {
        return this.createCircularNode(
          metadata.name,
          metadata.version,
          depth,
          parent,
        );
      }

      this.inProgress.add(nodeId);

      const health = await this.healthService.calculate(metadata.name);

      const node: DependencyNode = {
        id: nodeId,
        name: metadata.name,
        version: metadata.version,
        health,
        depth,
        dependencies: [],
        parent,
      };

      if (depth < maxDepth && metadata.dependencies) {
        const deps = Object.entries(metadata.dependencies);
        node.dependencies = await this.resolveChildren(
          deps,
          depth + 1,
          maxDepth,
          nodeId,
        );
      }

      this.resolved.set(nodeId, node);
      this.inProgress.delete(nodeId);

      return node;
    } catch (error) {
      return this.createErrorNode(name, version, depth, parent);
    }
  }

  /**
   * Resolve children with concurrency limit
   */
  private async resolveChildren(
    deps: [string, string][],
    depth: number,
    maxDepth: number,
    parent: string,
  ): Promise<DependencyNode[]> {
    const results: DependencyNode[] = [];

    for (let i = 0; i < deps.length; i += CONCURRENCY_LIMIT) {
      const batch = deps.slice(i, i + CONCURRENCY_LIMIT);

      const batchResults = await Promise.all(
        batch.map(([depName, depVersion]) =>
          this.resolveNode(depName, depVersion, depth, maxDepth, parent).catch(
            () => this.createErrorNode(depName, depVersion, depth, parent),
          ),
        ),
      );

      results.push(...batchResults);
    }

    return results;
  }

  private createCircularNode(
    name: string,
    version: string,
    depth: number,
    parent?: string,
  ): DependencyNode {
    return {
      id: `${name}@${version}:circular`,
      name,
      version,
      health: this.emptyHealth(),
      depth,
      dependencies: [],
      parent,
      isCircular: true,
    };
  }

  private createErrorNode(
    name: string,
    version: string,
    depth: number,
    parent?: string,
  ): DependencyNode {
    return {
      id: `${name}@${version}:error`,
      name,
      version,
      health: this.emptyHealth(),
      depth,
      dependencies: [],
      parent,
      hasError: true,
    };
  }

  /**
   * Calculate tree statistics
   */
  private calculateStats(root: DependencyNode): TreeStats {
    const seen = new Set<string>();
    const distribution: Record<HealthLevel, number> = {
      healthy: 0,
      warning: 0,
      critical: 0,
      unknown: 0,
    };
    let total = 0;
    let maxDepth = 0;

    const traverse = (node: DependencyNode) => {
      total++;
      seen.add(node.id);
      distribution[node.health.level]++;
      maxDepth = Math.max(maxDepth, node.depth);

      for (const child of node.dependencies) {
        traverse(child);
      }
    };

    traverse(root);

    return {
      totalPackages: total,
      uniquePackages: seen.size,
      maxDepth,
      healthDistribution: distribution,
    };
  }

  private emptyHealth(): HealthScore {
    return {
      overall: 0,
      level: "unknown",
      breakdown: { maintenance: 0, popularity: 0, activity: 0, security: 0 },
      vulnerabilities: [],
      lastPublish: "",
      weeklyDownloads: 0,
      openIssues: 0,
      closedIssues: 0,
    };
  }
}
