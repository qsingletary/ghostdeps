---
"ghostdeps": minor
---

Add supply-chain warning system. Every resolved dependency node is now run through a `SupplyChainAnalyzer` that surfaces three classes of red flag: **typosquat** (Levenshtein distance ≤2 from one of ~240 well-known npm packages), **new-popularity** (<7 days old with >1000 weekly downloads — atypical traction for a brand-new package), and **single-maintainer-new** (solo author on a <30-day-old package). Warnings are attached per-node, shown in a dedicated "Supply-chain" section in the NodeDetail panel with severity pill and kind label, and aggregated into a count pill on the TreeStats bar.
