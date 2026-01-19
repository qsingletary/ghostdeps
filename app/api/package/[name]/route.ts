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
  const version = request.nextUrl.searchParams.get("version") || "latest";

  try {
    const repository = container.getPackageRepository();
    const metadata = await repository.findByName(name, version);

    return NextResponse.json(metadata);
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

  console.error("[API /packages] Unexpected error:", error);
  return NextResponse.json(
    { error: "Internal server error", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
