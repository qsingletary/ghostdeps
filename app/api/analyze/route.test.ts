import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { container, PackageError, type HealthScore } from "@/modules/packages";

vi.mock("@/modules/packages", async () => {
  const actual = await vi.importActual("@/modules/packages");
  return {
    ...actual,
    container: {
      getHealthService: vi.fn(),
    },
  };
});

describe("POST /api/analyze", () => {
  const mockCalculateBatch = vi.fn();

  const healthScore = (overall: number): HealthScore => ({
    overall,
    level: overall >= 70 ? "healthy" : overall >= 40 ? "warning" : "critical",
    breakdown: {
      maintenance: overall,
      popularity: overall,
      activity: overall,
      security: overall,
    },
    vulnerabilities: [],
    lastPublish: "2024-01-01",
    weeklyDownloads: 1000,
    openIssues: 0,
    closedIssues: 0,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(container.getHealthService).mockReturnValue({
      calculate: vi.fn(),
      calculateBatch: mockCalculateBatch,
      getLevel: vi.fn(),
    });
  });

  const createRequest = (body: unknown): NextRequest =>
    new NextRequest("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

  it("should return analysis with health scores for dependencies", async () => {
    const packageJson = JSON.stringify({
      name: "my-app",
      version: "1.0.0",
      dependencies: { lodash: "^4.17.21" },
      devDependencies: { vitest: "^4.0.0" },
    });

    const healthMap = new Map([
      ["lodash", healthScore(90)],
      ["vitest", healthScore(85)],
    ]);
    mockCalculateBatch.mockResolvedValue(healthMap);

    const response = await POST(createRequest({ packageJson }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.projectName).toBe("my-app");
    expect(data.projectVersion).toBe("1.0.0");
    expect(data.dependencies).toEqual(["lodash"]);
    expect(data.devDependencies).toEqual(["vitest"]);
    expect(data.healthScores.lodash.overall).toBe(90);
    expect(data.healthScores.vitest.overall).toBe(85);
    expect(data.analyzedAt).toBeDefined();
    expect(mockCalculateBatch).toHaveBeenCalledWith(
      expect.arrayContaining(["lodash", "vitest"]),
    );
  });

  it("should reject requests missing the packageJson field", async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_REQUEST");
    expect(mockCalculateBatch).not.toHaveBeenCalled();
  });

  it("should reject requests with non-string packageJson", async () => {
    const response = await POST(createRequest({ packageJson: 42 }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_REQUEST");
  });

  it("should reject malformed JSON content", async () => {
    const response = await POST(
      createRequest({ packageJson: "{ not valid" }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("INVALID_JSON");
  });

  it("should reject a package.json with no dependencies", async () => {
    const packageJson = JSON.stringify({ name: "empty", version: "1.0.0" });

    const response = await POST(createRequest({ packageJson }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("NO_DEPS");
    expect(mockCalculateBatch).not.toHaveBeenCalled();
  });

  it("should handle PackageError from the health service", async () => {
    const packageJson = JSON.stringify({
      dependencies: { lodash: "^4.17.21" },
    });
    mockCalculateBatch.mockRejectedValue(
      new PackageError("Upstream down", "UPSTREAM_ERROR", 502),
    );

    const response = await POST(createRequest({ packageJson }));
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.code).toBe("UPSTREAM_ERROR");
  });

  it("should handle unexpected errors as INTERNAL_ERROR", async () => {
    const packageJson = JSON.stringify({
      dependencies: { lodash: "^4.17.21" },
    });
    mockCalculateBatch.mockRejectedValue(new Error("oops"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(createRequest({ packageJson }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.code).toBe("INTERNAL_ERROR");

    consoleSpy.mockRestore();
  });
});
