export interface ParsedPackageJson {
  name?: string;
  version?: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  allDependencies: string[];
}

export interface ParseError {
  message: string;
  code: "INVALID_JSON" | "INVALID_STRUCTURE";
}

export type ParseResult =
  | { success: true; data: ParsedPackageJson }
  | { success: false; error: ParseError };

export function parsePackageJson(content: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      success: false,
      error: {
        message: "Invalid JSON: Could not parse package.json content",
        code: "INVALID_JSON",
      },
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      success: false,
      error: {
        message: "Invalid structure: package.json must be an object",
        code: "INVALID_STRUCTURE",
      },
    };
  }

  const pkg = parsed as Record<string, unknown>;

  const name = typeof pkg.name === "string" ? pkg.name : undefined;
  const version = typeof pkg.version === "string" ? pkg.version : undefined;

  const dependencies = extractDependencies(pkg.dependencies);
  const devDependencies = extractDependencies(pkg.devDependencies);

  const allDependencies = [
    ...new Set([...Object.keys(dependencies), ...Object.keys(devDependencies)]),
  ];

  return {
    success: true,
    data: {
      name,
      version,
      dependencies,
      devDependencies,
      allDependencies,
    },
  };
}

function extractDependencies(deps: unknown): Record<string, string> {
  if (typeof deps !== "object" || deps === null || Array.isArray(deps)) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(deps)) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }

  return result;
}
