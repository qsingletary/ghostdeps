import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryCache } from "./memory-cache";

describe("MemoryCache", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("get", () => {
    it("should return null for non-existent keys", async () => {
      const result = await cache.get("non-existent");
      expect(result).toBeNull();
    });

    it("should return cached value for existing keys", async () => {
      await cache.set("key", { data: "test" }, 3600);
      const result = await cache.get<{ data: string }>("key");
      expect(result).toEqual({ data: "test" });
    });

    it("should return null for expired entries", async () => {
      await cache.set("key", "value", 10); // 10 second TTL

      // Advance time by 11 seconds
      vi.advanceTimersByTime(11000);

      const result = await cache.get("key");
      expect(result).toBeNull();
    });

    it("should return value just before expiration", async () => {
      await cache.set("key", "value", 10);

      // Advance time by 9 seconds (still valid)
      vi.advanceTimersByTime(9000);

      const result = await cache.get("key");
      expect(result).toBe("value");
    });
  });

  describe("set", () => {
    it("should store values with correct TTL", async () => {
      await cache.set("key", "value", 60);

      const result = await cache.get("key");
      expect(result).toBe("value");
    });

    it("should overwrite existing values", async () => {
      await cache.set("key", "value1", 60);
      await cache.set("key", "value2", 60);

      const result = await cache.get("key");
      expect(result).toBe("value2");
    });

    it("should handle complex objects", async () => {
      const complexObject = {
        name: "test",
        nested: { array: [1, 2, 3] },
        date: new Date().toISOString(),
      };

      await cache.set("complex", complexObject, 60);
      const result = await cache.get<typeof complexObject>("complex");

      expect(result).toEqual(complexObject);
    });
  });

  describe("delete", () => {
    it("should remove cached entries", async () => {
      await cache.set("key", "value", 60);
      await cache.delete("key");

      const result = await cache.get("key");
      expect(result).toBeNull();
    });

    it("should not throw for non-existent keys", async () => {
      await expect(cache.delete("non-existent")).resolves.not.toThrow();
    });
  });

  describe("TTL behavior", () => {
    it("should expire entries at exact TTL boundary", async () => {
      await cache.set("key", "value", 5);

      // Just before expiration
      vi.advanceTimersByTime(4999);
      expect(await cache.get("key")).toBe("value");

      // At expiration
      vi.advanceTimersByTime(1);
      expect(await cache.get("key")).toBe("value");

      // After expiration
      vi.advanceTimersByTime(1);
      expect(await cache.get("key")).toBeNull();
    });

    it("should clean up expired entries on get", async () => {
      await cache.set("key", "value", 1);

      vi.advanceTimersByTime(2000);

      // First get should clean up the entry
      const result = await cache.get("key");
      expect(result).toBeNull();
    });
  });
});
