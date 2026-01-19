export class PackageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "PackageError";
  }
}

export class PackageNotFoundError extends PackageError {
  constructor(name: string, version?: string) {
    const pkg = version ? `${name}@${version}` : name;
    super(`Package not found: ${pkg}`, "PACKAGE_NOT_FOUND", 404);
    this.name = "PackageNotFoundError";
  }
}

export class ResolutionError extends PackageError {
  constructor(name: string, reason: string) {
    super(`Failed to resolve ${name}: ${reason}`, "RESOLUTION_FAILED", 500);
    this.name = "ResolutionError";
  }
}

export class ExternalApiError extends PackageError {
  constructor(api: string, status: number) {
    super(`${api} returned ${status}`, "EXTERNAL_API_ERROR", 502);
    this.name = "ExternalApiError";
  }
}
