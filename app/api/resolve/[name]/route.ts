import { NextRequest, NextResponse } from "next/server";
import {
  container,
  PackageNotFoundError,
  PackageError,
} from "@/modules/packages";

// Allow longer execution for large trees
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ name: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  const version = request.nextUrl.searchParams.get("version") || "latest";
  const maxDepth = parseMaxDepth(request.nextUrl.searchParams.get("maxDepth"));

  try {
    const resolver = container.getDependencyResolver();
    const tree = await resolver.resolve(name, version, maxDepth);

    return NextResponse.json(tree);
  } catch (error) {
    return handleError(error);
  }
}

function parseMaxDepth(value: string | null): number {
  if (!value) return 5;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 5;

  return Math.min(Math.max(parsed, 1), 10);
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

  console.error("[API /resolve] Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
