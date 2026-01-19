# ghostdeps

## 0.3.0 — Minor Release

### Frontend

- **feat(ui):** Complete frontend implementation with dark/light theme support
- Updated components with improved styling
- Added responsive dependency graph visualization
- Implemented search input with debounced autocomplete
- Added node detail panel with health breakdown display
- Updated global styles with custom color palette

### Testing (253 tests)

- Added Vitest with React Testing Library and jsdom
- Tested API routes: `search`, `package`, `resolve`, `health` endpoints
- Tested services: `HealthService`, `DependencyResolver`
- Tested adapters: `MemoryCache`, `NpmRegistryClient`, `NpmsApiClient`
- Tested components: `HealthBadge`, `SearchInput`, `SearchResults`, `ThemeToggle`, `TreeStats`, `NodeDetail`
- Tested hooks: `usePackageSearch`, `useDependencyTree`, `useTheme`
- Tested store: `useUIStore`

### Assets

- Added light/dark favicon variants (16x16, 32x32, 180x180)
- Added light/dark logo SVGs

---

## 0.2.0 — Minor Release

### Packages Module

- Introduced foundational building blocks for package management

#### New Adapters

- `MemoryCache`
- `RedisCache`
- `NpmRegistryClient`
- `NpmsApiClient`

#### Core Interfaces

- `ICache`
- `INpmClient` – interface for npm registry access
- `INpmsClient` – interface for npms.io health/score data
- `IPackageRepository` – abstracts data access and caching
- `IHealthService` – health score calculation
- `IDependencyResolver` – dependency tree resolution

#### Core Types and Errors

- Package domain errors
- Core package types
