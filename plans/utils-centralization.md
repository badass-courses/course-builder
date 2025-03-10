# Utility Function Centralization Plan

## Overview

This plan outlines a strategy to centralize duplicate utility functions from `/apps/*/src/utils` into shared packages. This refactoring will reduce code duplication, improve maintainability, and ensure consistent behavior across applications.

## Problem Statement

Currently, many utility functions are duplicated across different applications in the monorepo. This leads to:
- Maintenance challenges when fixing bugs or making improvements
- Inconsistencies as implementations diverge
- Violation of DRY (Don't Repeat Yourself) principles
- Increased cognitive load for developers working across apps

## Approach

We'll create or expand shared packages in the `/packages` directory, organized by function domain. For each utility function, we'll:

1. Analyze current implementations across apps
2. Create a canonical version in the appropriate shared package
3. Update imports in all apps to use the shared implementation
4. Add tests to ensure reliability

## Utility Functions to Centralize

Based on analysis of the codebase, these are the primary utilities to centralize:

| Function | Purpose | Found In | Target Package |
|----------|---------|----------|---------------|
| cn.ts | Tailwind class merging | All apps | @coursebuilder/ui-utils |
| guid.ts | ID generation | All apps | @coursebuilder/core |
| get-unique-filename.ts | File naming | All apps | @coursebuilder/file-utils |
| send-an-email.ts | Email sending | All apps | @coursebuilder/email-utils |
| aws.ts | AWS integration | Multiple apps | @coursebuilder/aws-utils |
| openai.ts | OpenAI client | All apps | @coursebuilder/ai-utils |
| get-og-image-url-for-resource.ts | OG image URLs | All apps | @coursebuilder/seo-utils |
| chicagor-title.ts | Text formatting | Multiple apps | @coursebuilder/string-utils |
| cookies.ts | Cookie management | Multiple apps | @coursebuilder/browser-utils |
| uploadthing.ts | File uploads | All apps | @coursebuilder/file-utils |
| poll-video-resource.ts | Resource polling | All apps | @coursebuilder/media-utils |
| filter-resources.ts | Resource filtering | Multiple apps | @coursebuilder/resource-utils |
| get-current-ability-rules.ts | Authorization | Multiple apps | @coursebuilder/auth-utils |
| typesense-instantsearch-adapter.ts | Search | Multiple apps | @coursebuilder/search-utils |

## Package Structure

We'll organize utilities into domain-focused packages:

1. **@coursebuilder/core** - Core utilities (guid, etc.)
2. **@coursebuilder/ui-utils** - UI-related utilities (cn, etc.)
3. **@coursebuilder/file-utils** - File handling (get-unique-filename, uploadthing)
4. **@coursebuilder/string-utils** - String manipulation (chicagor-title, etc.)
5. **@coursebuilder/browser-utils** - Browser-specific utilities (cookies)
6. **@coursebuilder/ai-utils** - AI-related utilities (openai)
7. **@coursebuilder/media-utils** - Media handling utilities (poll-video-resource)
8. **@coursebuilder/seo-utils** - SEO utilities (get-og-image-url-for-resource)
9. **@coursebuilder/email-utils** - Email utilities (send-an-email)
10. **@coursebuilder/aws-utils** - AWS utilities (aws.ts)
11. **@coursebuilder/auth-utils** - Auth utilities (get-current-ability-rules)
12. **@coursebuilder/search-utils** - Search utilities (typesense-instantsearch-adapter)
13. **@coursebuilder/resource-utils** - Resource utilities (filter-resources)

## Implementation Plan

### Phase 1: Core & UI Utilities

1. Create/update @coursebuilder/core and @coursebuilder/ui-utils packages
2. Centralize guid.ts and cn.ts
3. Update imports in all apps
4. Add tests to ensure functionality remains identical

### Phase 2: File & String Utilities

1. Create @coursebuilder/file-utils and @coursebuilder/string-utils
2. Centralize get-unique-filename.ts, uploadthing.ts, chicagor-title.ts
3. Update imports in all apps
4. Add tests

### Phase 3: Browser & Media Utilities

1. Create @coursebuilder/browser-utils and @coursebuilder/media-utils
2. Centralize cookies.ts and poll-video-resource.ts
3. Update imports in all apps
4. Add tests

### Phase 4: Service-specific Utilities

1. Create remaining utility packages
2. Centralize remaining utilities
3. Update imports in all apps
4. Add tests

### Phase 5: Documentation & Usage Guidelines

1. Document all centralized utilities
2. Create usage guidelines for team members
3. Update CONTRIBUTING.md with information about shared utilities

## Risks & Mitigations

- **Breaking changes**: Ensure all implementations are backward compatible
- **Import complexity**: Use consistent import paths
- **Different requirements**: Create flexible utilities with sensible defaults
- **Testing complexity**: Write comprehensive tests for each utility

## Success Metrics

- Reduction in duplicate code
- Consistent behavior across apps
- Improved maintainability
- Easier onboarding for new developers
- Reduced time to implement new features that use these utilities

## Future Considerations

- Consider automatic code generation for repetitive patterns
- Implement a monorepo documentation tool to make shared utilities discoverable
- Create a utilities showcase to demo available utilities