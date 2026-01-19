import { DependencyTree } from "../types";

export interface IDependencyResolver {
  /**
   * Resolve full dependency tree for a package
   * @param name - Package name
   * @param version - Version (default: 'latest')
   * @param maxDepth - How deep to traverse (default: 5, max: 10)
   */
  resolve(
    name: string,
    version?: string,
    maxDepth?: number,
  ): Promise<DependencyTree>;
}
