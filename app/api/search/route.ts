import { NextRequest, NextResponse } from "next/server";
import { container, PackageError } from "@/modules/packages";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  // Require at least 2 characters
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const repository = container.getPackageRepository();
    const results = await repository.search(query, limit);

    return NextResponse.json({ results });
  } catch (error) {
    return handleError(error);
  }
}

function parseLimit(value: string | null): number {
  if (!value) return 10;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return 10;

  return Math.min(Math.max(parsed, 1), 25);
}

function handleError(error: unknown): NextResponse {
  if (error instanceof PackageError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  console.error("[API /search] Unexpected error:", error);
  return NextResponse.json(
    { error: "Search failed", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
