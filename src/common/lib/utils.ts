import type { HealthLevel } from "@/modules/packages/types";

export function getHealthLevel(score: number): HealthLevel {
  if (score >= 70) return "healthy";
  if (score >= 40) return "warning";
  if (score > 0) return "critical";
  return "unknown";
}

export function createPackageId(name: string, version: string): string {
  return `${name}@${version}`;
}

export function daysSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
