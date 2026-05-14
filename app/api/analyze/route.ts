import { NextRequest, NextResponse } from "next/server";
import {
  container,
  parsePackageJson,
  PackageError,
  type HealthScore,
} from "@/modules/packages";

export interface AnalysisResponse {
  projectName?: string;
  projectVersion?: string;
  dependencies: string[];
  devDependencies: string[];
  healthScores: Record<string, HealthScore>;
  analyzedAt: string;
}

interface AnalysisRequest {
  packageJson: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalysisRequest;

    if (!body.packageJson || typeof body.packageJson !== "string") {
      return NextResponse.json(
        { error: "Missing packageJson field", code: "INVALID_REQUEST" },
        { status: 400 },
      );
    }

    const parseResult = parsePackageJson(body.packageJson);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.message, code: parseResult.error.code },
        { status: 400 },
      );
    }

    const { data } = parseResult;

    if (data.allDependencies.length === 0) {
      return NextResponse.json(
        { error: "No dependencies found in package.json", code: "NO_DEPS" },
        { status: 400 },
      );
    }

    const healthService = container.getHealthService();
    const healthMap = await healthService.calculateBatch(data.allDependencies);

    const healthScores: Record<string, HealthScore> = {};
    for (const [name, score] of healthMap) {
      healthScores[name] = score;
    }

    const response: AnalysisResponse = {
      projectName: data.name,
      projectVersion: data.version,
      dependencies: Object.keys(data.dependencies),
      devDependencies: Object.keys(data.devDependencies),
      healthScores,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown): NextResponse {
  if (error instanceof PackageError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  console.error("[API /analyze] Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
