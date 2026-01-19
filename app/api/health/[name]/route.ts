import { NextRequest, NextResponse } from "next/server";
import {
  container,
  PackageNotFoundError,
  PackageError,
} from "@/modules/packages";

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);

  try {
    const healthService = container.getHealthService();
    const score = await healthService.calculate(name);

    return NextResponse.json(score);
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown): NextResponse {
  if (error instanceof PackageNotFoundError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  if (error instanceof PackageError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  console.error("[API /health] Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
