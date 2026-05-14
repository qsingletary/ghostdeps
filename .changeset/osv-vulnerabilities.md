---
"ghostdeps": minor
---

Replace the broken npms.io vulnerability data with real CVE/GHSA data from OSV.dev. Vulnerabilities are now version-aware (the resolver passes resolved versions through to OSV), surfaced in the NodeDetail panel with severity, CVSS score, and an actionable "Update to ≥X.Y.Z" fix-version chip, and weighted into the health score using a CVSS-aware penalty model. The security pillar's weight rises from 20% to 30% so that real vulns move the needle.
