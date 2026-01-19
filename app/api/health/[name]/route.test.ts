import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import {
  container,
  PackageError,
  PackageNotFoundError,
} from "@/modules/packages";

vi.mock("@/modules/packages", async () => {
  const actual = await vi.importActual("@/modules/packages");
  return {
    ...actual,
    container: {
      getHealthService: vi.fn(),
    },
  };
});

describe("GET /api/health/[name]", () => {
  const mockCalculate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(container.getHealthService).mockReturnValue({
      calculate: mockCalculate,
      calculateBatch: vi.fn(),
      getLevel: vi.fn(),
    });
  });

  const createRequest = (): NextRequest => {
    return new NextRequest("http://localhost/api/health/lodash");
  };

  const createParams = (name: string) => ({
    params: Promise.resolve({ name }),
  });

  const createHealthScore = () => ({
    overall: 85,
    level: "healthy",
    breakdown: {
      maintenance: 90,
      popularity: 80,
      activity: 85,
      security: 100,
    },
    vulnerabilities: [],
    lastPublish: "2024-01-01",
    weeklyDownloads: 50000,
    openIssues: 10,
    closedIssues: 90,
  });

  it("should return health score", async () => {
    const score = createHealthScore();
    mockCalculate.mockResolvedValue(score);

    const response = await GET(createRequest(), createParams("lodash"));
    const data = await response.json();

    expect(data).toEqual(score);
    expect(mockCalculate).toHaveBeenCalledWith("lodash");
  });

  it("should decode URL-encoded package names", async () => {
    mockCalculate.mockResolvedValue(createHealthScore());

    await GET(createRequest(), createParams("%40org%2Fpackage"));

    expect(mockCalculate).toHaveBeenCalledWith("@org/package");
  });

  it("should handle PackageNotFoundError", async () => {
    mockCalculate.mockRejectedValue(new PackageNotFoundError("nonexistent"));

    const response = await GET(createRequest(), createParams("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("PACKAGE_NOT_FOUND");
  });

  it("should handle PackageError", async () => {
    mockCalculate.mockRejectedValue(
      new PackageError("Health calculation failed", "HEALTH_ERROR", 503),
    );

    const response = await GET(createRequest(), createParams("test"));
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.code).toBe("HEALTH_ERROR");
  });

  it("should handle unexpected errors", async () => {
    mockCalculate.mockRejectedValue(new Error("Unexpected"));

    const response = await GET(createRequest(), createParams("test"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");
  });
});
