# Course Builder Development Guide

## Build Commands
- `pnpm build:all` - Build all packages and apps
- `pnpm build` - Build all packages (not apps)
- `pnpm build --filter="ai-hero"` - Build ai-hero app
- `pnpm dev:all` - Run dev environment for all packages/apps
- `pnpm dev` - Run dev environment for packages only

## Testing
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `vitest run src/path/to/test.test.ts` - Run a single test file

## Linting and Formatting
- `pnpm lint` - Run linting on all packages/apps
- `pnpm format:check` - Check formatting without changing files
- `pnpm format` - Format all files using Prettier
- `pnpm typecheck` - Run TypeScript type checking

`--filter="APP_NAME"` - Run above commands for a specific app

## Code Style
- **Formatting**: Single quotes, no semicolons, tabs (width: 2), 80 char line limit
- **Imports**: Organized by specific order (React → Next → 3rd party → internal)
- **File structure**: Monorepo with apps in /apps and packages in /packages
- **Package Manager**: PNPM (v8.15.5+)
- **Testing Framework**: Vitest

## Project Structure

### Packages
- `packages/ui` - Shared UI components in the ShadCN style using Radix. these components are transpiled into apps
- `packages/core` - shared core library that is framework agnostic
- `packages/adapter-drizzle` - a drizzle ORM adapter for connecting a MySQL database to an application for Course Builder
- `packages/next` - nextjs specific bindings for Course Builder api
- `packages/commerce-next` - nextjs specific bindings for Commerce components and functionality
