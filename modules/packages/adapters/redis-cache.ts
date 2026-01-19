import { Redis } from "@upstash/redis";
import { ICache } from "../interfaces";

export class RedisCache implements ICache {
  private client: Redis;

  constructor(url: string, token: string) {
    this.client = new Redis({ url, token });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value as T | null;
    } catch (error) {
      console.error(`[RedisCache] GET failed for "${key}":`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), { ex: ttlSeconds });
    } catch (error) {
      console.error(`[RedisCache] SET failed for "${key}":`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`[RedisCache] DEL failed for "${key}":`, error);
    }
  }
}
