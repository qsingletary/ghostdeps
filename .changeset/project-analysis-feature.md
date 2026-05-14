---
"ghostdeps": minor
---

Add project analysis feature: drop a `package.json` (or paste its contents) to batch-analyze the health of every direct and dev dependency. Includes filtering by health level / runtime-vs-dev, sorting by risk/health/name, a project health summary with riskiest-packages callout, and a dedicated `POST /api/analyze` endpoint.
