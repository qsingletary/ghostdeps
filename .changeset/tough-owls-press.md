---
"ghostdeps": minor
---

Summary:
This release introduces the foundational building blocks for the packages module:

New Adapters:
• MemoryCache
• RedisCache
• NpmRegistryClient
• NpmsApiClient

Core Interfaces:
• ICache
• INpmClient – interface for npm registry access
• INpmsClient – interface for npms.io health/score data
• IPackageRepository – abstracts data access and caching
• IHealthService – health score calculation
• IDependencyResolver – dependency tree resolution

Core Types and Errors:
• Package domain errors
• Core package types
