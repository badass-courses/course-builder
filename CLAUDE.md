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

## Code Generation and Scaffolding

### Creating New Utility Packages
Use the custom Plop template to create new utility packages:

```bash
# Create a new utility package using the template
pnpm plop package-utils <domain> <utilityName> <functionName> "<utilityDescription>"

# Example:
pnpm plop package-utils browser cookies getCookies "Browser cookie utility"

# With named parameters:
pnpm plop package-utils -- --domain browser --utilityName cookies --functionName getCookies --utilityDescription "Browser cookie utility"
```

This will create a properly structured package with:
- Correct package.json with exports configuration
- TypeScript configuration
- Basic implementation with proper TSDoc comments
- Test scaffolding

### Working with Utility Packages

When updating package.json files to add dependencies:
1. Use string replacement with Edit tool to add dependencies
2. Maintain alphabetical order of dependencies
3. Don't replace entire sections, just add the new line

Example of proper package.json edit:
```
"@coursebuilder/utils-media": "1.0.0",
"@coursebuilder/utils-seo": "1.0.0",

// Replace with:
"@coursebuilder/utils-media": "1.0.0",
"@coursebuilder/utils-resource": "1.0.0", // New line added here
"@coursebuilder/utils-seo": "1.0.0",
```

## Code Style
- **Formatting**: Single quotes, no semicolons, tabs (width: 2), 80 char line limit
- **Imports**: Organized by specific order (React → Next → 3rd party → internal)
- **File structure**: Monorepo with apps in /apps and packages in /packages
- **Package Manager**: PNPM (v8.15.5+)
- **Testing Framework**: Vitest

## Project Structure

### Core Packages
- `packages/ui` - Shared UI components in the ShadCN style using Radix. these components are transpiled into apps
- `packages/core` - shared core library that is framework agnostic
- `packages/adapter-drizzle` - a drizzle ORM adapter for connecting a MySQL database to an application for Course Builder
- `packages/next` - nextjs specific bindings for Course Builder api
- `packages/commerce-next` - nextjs specific bindings for Commerce components and functionality

### Utility Packages
- `@coursebuilder/utils-ai` - AI-related utilities
- `@coursebuilder/utils-auth` - Authentication and authorization utilities
- `@coursebuilder/utils-aws` - AWS service utilities
- `@coursebuilder/utils-browser` - Browser-specific utilities (cookies, etc.)
- `@coursebuilder/utils-core` - Core utilities like `guid`
- `@coursebuilder/utils-email` - Email-related utilities
- `@coursebuilder/utils-file` - File handling utilities
- `@coursebuilder/utils-media` - Media processing utilities
- `@coursebuilder/utils-resource` - Resource filtering and processing utilities
- `@coursebuilder/utils-search` - Search functionality utilities
- `@coursebuilder/utils-seo` - SEO utilities
- `@coursebuilder/utils-string` - String manipulation utilities
- `@coursebuilder/utils-ui` - UI utilities like `cn`

## Common Patterns

### Re-export Pattern for Backward Compatibility
When creating shared utility packages, use the re-export pattern to maintain backward compatibility:

```typescript
// In /apps/app-name/src/utils/some-utility.ts
// Re-export from the shared package
export { someUtility } from '@coursebuilder/utils-domain/some-utility'
```

This preserves existing import paths throughout the codebase while moving the implementation to a shared package.

### TSDoc Comments for Utilities
Always include comprehensive TSDoc comments for utility functions:

```typescript
/**
 * Brief description of what the function does
 * 
 * Additional details if needed
 * 
 * @param paramName - Description of the parameter
 * @returns Description of the return value
 * 
 * @example
 * ```ts
 * // Example usage code
 * const result = myFunction('input')
 * ```
 */
```
