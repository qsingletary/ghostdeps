---
"ghostdeps": minor
---

Add bundle size as a 5th health pillar. Bundle data (minified + gzipped sizes, tree-shakability, dependency count) is fetched from Bundlephobia, weighted at 15% of the overall health score (with a 5-point bonus for ESM packages without side effects), surfaced in the NodeDetail panel via a new "Size" breakdown row plus "Bundle (gzip)" and "Tree-shake" stat cards, and shown as a Bundle pill in the TreeStats bar for the resolved root package. Bundle results are version-aware and cached for 24h.
