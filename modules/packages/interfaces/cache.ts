export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

export const CacheKeys = {
  package: (name: string, version: string) => `pkg:${name}:${version}`,
  health: (name: string) => `health:${name}`,
  tree: (name: string, version: string, depth: number) =>
    `tree:${name}:${version}:${depth}`,
  search: (query: string) => `search:${query}`,
  npms: (name: string) => `npms:${name}`,
} as const;

export const CacheTTL = {
  PACKAGE: 3600,
  HEALTH: 21600,
  TREE: 1800,
  SEARCH: 300,
  NPMS: 21600,
} as const;
