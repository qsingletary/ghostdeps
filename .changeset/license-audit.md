---
"ghostdeps": minor
---

Add license audit. Every package's `license` field is now classified into one of five compliance buckets (permissive, weak-copyleft, strong-copyleft, proprietary, unknown), surfaced as a small SPDX pill next to the version in the NodeDetail header and aggregated into a "License audit" section in the Project Analysis panel. The audit section renders a per-category count strip and flags every package that is strong-copyleft (GPL / AGPL / SSPL), proprietary (`UNLICENSED`, BSL, "SEE LICENSE IN", etc.), or has no detectable license.
