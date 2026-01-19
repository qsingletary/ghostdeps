# GhostDeps

Scan and visualize npm package dependency health before installation.

## Getting Started

Install dependencies:

`npm install`

Run the development server:

`npm run dev`

Open http://localhost:3000 in your browser.

## Features

- Search npm packages with autocomplete
- Visualize full dependency trees
- Health scoring (healthy, warning, critical)
- Security vulnerability detection
- Maintenance and popularity metrics
- Dark/light theme support
- Responsive design

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `UPSTASH_REDIS_REST_URL` - Redis URL for caching (optional)
- `UPSTASH_REDIS_REST_TOKEN` - Redis token (optional)

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- Vitest

## Project Structure

- `app/page.tsx` - main page
- `app/api/` - API routes
  - `search/` - package search
  - `resolve/` - dependency resolution
  - `health/` - health scoring
  - `package/` - package metadata
- `components/` - UI components
  - `SearchInput/` - search bar
  - `SearchResults/` - autocomplete dropdown
  - `DependencyGraph/` - tree visualization
  - `HealthBadge/` - health indicators
  - `NodeDetail/` - package details panel
  - `TreeStats/` - summary statistics
  - `ThemeToggle/` - dark/light switch
- `hooks/` - custom React hooks
- `stores/` - Zustand state management
- `modules/packages/` - core business logic

## Scripts

- `npm run dev` - development server
- `npm run build` - production build
- `npm run test` - run tests
- `npm run lint` - lint code
- `npm run typecheck` - type checking
