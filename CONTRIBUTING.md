# Contributing to Course Builder

Thank you for your interest in contributing to Course Builder! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Shared Utilities](#shared-utilities)
4. [Code Style](#code-style)
5. [Testing](#testing)
6. [Pull Requests](#pull-requests)

## Getting Started

1. Clone the repository: `git clone https://github.com/joelhooks/course-builder.git`
2. Install dependencies: `pnpm install`
3. Start the development server: `pnpm dev`

## Development Workflow

Course Builder is a monorepo using [Turborepo](https://turbo.build/) and [pnpm workspaces](https://pnpm.io/workspaces).

- Apps are in the `/apps` directory
- Shared packages are in the `/packages` directory

Common commands:

- `pnpm build:all` - Build all packages and apps
- `pnpm build` - Build all packages (not apps)
- `pnpm build --filter="ai-hero"` - Build ai-hero app
- `pnpm dev:all` - Run dev environment for all packages/apps
- `pnpm dev` - Run dev environment for packages only

## Shared Utilities

Our monorepo includes shared utility packages under `/packages`:

- `@coursebuilder/utils-ai`: AI-related utilities
- `@coursebuilder/utils-auth`: Authentication and authorization utilities
- `@coursebuilder/utils-aws`: AWS service utilities
- `@coursebuilder/utils-browser`: Browser-specific utilities (cookies, etc.)
- `@coursebuilder/utils-core`: Core utilities like `guid`
- `@coursebuilder/utils-email`: Email-related utilities
- `@coursebuilder/utils-file`: File handling utilities
- `@coursebuilder/utils-media`: Media processing utilities
- `@coursebuilder/utils-resource`: Resource filtering and processing utilities
- `@coursebuilder/utils-search`: Search functionality utilities
- `@coursebuilder/utils-seo`: SEO utilities
- `@coursebuilder/utils-string`: String manipulation utilities
- `@coursebuilder/utils-ui`: UI utilities like `cn`

### Usage

Import utilities as follows:

```typescript
// Import from a specific utility file
import { guid } from '@coursebuilder/utils-core/guid'
import { cn } from '@coursebuilder/utils-ui/cn'
import cookieUtil from '@coursebuilder/utils-browser/cookies'
```

### Contributing New Utilities

To contribute a new utility:

1. Identify the appropriate package for your utility
2. If you're unsure where a utility belongs, discuss with the team
3. Use the Plop template to create a new utility:

```bash
# Create a new utility package using the template
pnpm plop package-utils <domain> <utilityName> <functionName> "<utilityDescription>"

# Example:
pnpm plop package-utils browser cookies getCookies "Browser cookie utility"
```

4. Implement your utility with comprehensive TSDoc comments
5. Add thorough test coverage
6. Update apps to use the new shared utility

## Code Style

- **Formatting**: We use Prettier with our shared configuration.
- **TypeScript**: Strict typing is enforced.
- **File naming**: Use kebab-case for file names.
- **Function naming**: Use camelCase for function names.

## Testing

- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- When adding new functionality, include tests that cover all significant logic.

## Pull Requests

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and commit them
3. Push your branch: `git push origin feature/my-feature`
4. Open a PR with a clear description of the changes
5. Ensure all tests pass before requesting review