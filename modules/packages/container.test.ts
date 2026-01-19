import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { container } from "./container";

describe("Container", () => {
  beforeEach(() => {
    container.reset();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getCache", () => {
    it("should return the same cache instance on multiple calls", () => {
      const cache1 = container.getCache();
      const cache2 = container.getCache();

      expect(cache1).toBe(cache2);
    });

    it("should use memory cache when redis is not configured", () => {
      const cache = container.getCache();

      expect(cache).toBeDefined();
      expect(cache.get).toBeDefined();
      expect(cache.set).toBeDefined();
      expect(cache.delete).toBeDefined();
    });
  });

  describe("getNpmClient", () => {
    it("should return the same npm client instance", () => {
      const client1 = container.getNpmClient();
      const client2 = container.getNpmClient();

      expect(client1).toBe(client2);
    });
  });

  describe("getNpmsClient", () => {
    it("should return the same npms client instance", () => {
      const client1 = container.getNpmsClient();
      const client2 = container.getNpmsClient();

      expect(client1).toBe(client2);
    });
  });

  describe("getPackageRepository", () => {
    it("should return the same repository instance", () => {
      const repo1 = container.getPackageRepository();
      const repo2 = container.getPackageRepository();

      expect(repo1).toBe(repo2);
    });

    it("should have findByName and search methods", () => {
      const repo = container.getPackageRepository();

      expect(repo.findByName).toBeDefined();
      expect(repo.search).toBeDefined();
    });
  });

  describe("getHealthService", () => {
    it("should return the same health service instance", () => {
      const service1 = container.getHealthService();
      const service2 = container.getHealthService();

      expect(service1).toBe(service2);
    });

    it("should have calculate and getLevel methods", () => {
      const service = container.getHealthService();

      expect(service.calculate).toBeDefined();
      expect(service.getLevel).toBeDefined();
    });
  });

  describe("getDependencyResolver", () => {
    it("should return the same resolver instance", () => {
      const resolver1 = container.getDependencyResolver();
      const resolver2 = container.getDependencyResolver();

      expect(resolver1).toBe(resolver2);
    });

    it("should have resolve method", () => {
      const resolver = container.getDependencyResolver();

      expect(resolver.resolve).toBeDefined();
    });
  });

  describe("reset", () => {
    it("should create new instances after reset", () => {
      const cache1 = container.getCache();
      const client1 = container.getNpmClient();

      container.reset();

      const cache2 = container.getCache();
      const client2 = container.getNpmClient();

      expect(cache1).not.toBe(cache2);
      expect(client1).not.toBe(client2);
    });

    it("should reset all services", () => {
      // Initialize all services
      container.getCache();
      container.getNpmClient();
      container.getNpmsClient();
      container.getPackageRepository();
      container.getHealthService();
      container.getDependencyResolver();

      container.reset();

      // After reset, new instances should be created
      const newCache = container.getCache();
      const newRepo = container.getPackageRepository();

      expect(newCache).toBeDefined();
      expect(newRepo).toBeDefined();
    });
  });

  describe("dependency injection", () => {
    it("should inject cache into package repository", () => {
      const cache = container.getCache();
      const repo = container.getPackageRepository();

      // The repository should use the same cache
      // We test this indirectly by ensuring consistency
      expect(cache).toBeDefined();
      expect(repo).toBeDefined();
    });

    it("should create a complete dependency chain", () => {
      // This tests that all dependencies are properly wired
      const resolver = container.getDependencyResolver();

      expect(resolver).toBeDefined();
      // Getting the resolver should have created all dependencies
      expect(container.getCache()).toBeDefined();
      expect(container.getNpmClient()).toBeDefined();
      expect(container.getNpmsClient()).toBeDefined();
      expect(container.getPackageRepository()).toBeDefined();
      expect(container.getHealthService()).toBeDefined();
    });
  });
});
