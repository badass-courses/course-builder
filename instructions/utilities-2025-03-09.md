**Objective:** You are tasked with centralizing duplicate utility functions currently scattered across various applications in a monorepo into shared packages. These utilities are located in `/apps/*/src/utils` directories and must be moved to appropriate packages under `/packages`. This refactoring aims to:
- Reduce code duplication.
- Improve maintainability.
- Ensure consistent behavior across applications.
- Reduce cognitive load for developers.

A critical requirement is that all centralized utilities must be thoroughly documented using TSdoc comments to enhance readability and support automated documentation generation.

**Automated Package Creation:** To streamline the process, a custom Plop template has been created for utility packages. You can use it to quickly scaffold new utility packages with the correct structure:

```bash
# Create a new utility package using the template
pnpm plop package-utils <domain> <utilityName> <functionName> "<utilityDescription>"

# Example:
pnpm plop package-utils browser cookies getCookies "Browser cookie utility"

# Alternatively, use named parameters:
pnpm plop package-utils -- --domain browser --utilityName cookies --functionName getCookies --utilityDescription "Browser cookie utility"
```

**Assumption:** You have access to the entire code base and can locate and analyze utility files as needed. If you cannot access the code directly, provide placeholder implementations and indicate where the actual code should be inserted based on analysis.

**Instructions Overview:**
- Process each utility listed below in the specified phases.
- Follow the discrete steps for each utility, stopping for feedback at each designated point.
- Generate all necessary code, including shared package structures, TSdoc comments, tests, and updated app imports.
- After processing all utilities, complete Phase 5 for documentation and guidelines.
- Use the exact package names and utility mappings provided.
- Do not skip any steps or details—follow the instructions precisely.

#### Utilities and Target Packages
Below is the mapping of utilities to their target shared packages. Use this mapping for all steps:

| **Utility**                     | **Target Package**            |
|---------------------------------|-------------------------------|
| `cn.ts`                        | `@coursebuilder/utils-ui`     |
| `guid.ts`                      | `@coursebuilder/utils-core`   |
| `get-unique-filename.ts`       | `@coursebuilder/utils-file`   |
| `send-an-email.ts`             | `@coursebuilder/utils-email`  |
| `aws.ts`                       | `@coursebuilder/utils-aws`    |
| `openai.ts`                    | `@coursebuilder/utils-ai`     |
| `get-og-image-url-for-resource.ts` | `@coursebuilder/utils-seo` |
| `chicagor-title.ts`            | `@coursebuilder/utils-string` |
| `cookies.ts`                   | `@coursebuilder/utils-browser`|
| `poll-video-resource.ts`       | `@coursebuilder/utils-media`  |
| `filter-resources.ts`          | `@coursebuilder/utils-resource` |
| `get-current-ability-rules.ts` | `@coursebuilder/utils-auth`   |
| `typesense-instantsearch-adapter.ts` | `@coursebuilder/utils-search` |

#### Phases and Steps
Execute the centralization in five phases, processing utilities in their respective categories. For each utility, follow these detailed, discrete steps. **Stop for feedback after each step marked with [STOP FOR FEEDBACK]** to ensure correctness before proceeding.

---

### Phase 1: Core & UI Utilities
**Utilities:** `guid.ts`, `cn.ts`

#### Step-by-Step Instructions for Each Utility
For each utility (`guid.ts`, `cn.ts`):

1. **Analyze Utilities**
   - **Action:** Locate all files named `<utility>.ts` (e.g., `guid.ts`) in `/apps/*/src/utils`.
   - **Task:** Compare their implementations across all apps:
     - Note the exported names (e.g., functions, variables) in each file.
     - Check if implementations are identical or different.
     - If identical, select that version as the canonical base.
     - If different, summarize the variations (e.g., additional parameters, logic differences).
   - **Task:** Propose a canonical version:
     - Use the identical version if all match.
     - If variations exist, adjust the version (e.g., add optional parameters) to support all use cases while maintaining backward compatibility.
   - **Output:** Provide:
     - A list of file locations (e.g., `/apps/app1/src/utils/guid.ts`, `/apps/app2/src/utils/guid.ts`).
     - A summary of findings (identical or differences).
     - The proposed canonical version as a TypeScript code snippet, including exported names.
   - **[STOP FOR FEEDBACK]:** Present the analysis and proposed canonical version. Wait for approval or modifications before proceeding.

2. **Create or Update Shared Package**
   - **Action:** Determine the target package from the mapping (e.g., `guid.ts` → `@coursebuilder/utils-core`).
   - **Task:** Check if the package exists in `/packages`:
     - If it **does not exist**:
       - **Recommended Method**: Use the package-utils Plop template:
         ```bash
         pnpm plop package-utils <domain> <utilityName> <functionName> "<utilityDescription>"
         
         # Example:
         pnpm plop package-utils core guid guid "Globally unique identifier generator"
         ```
         This will automatically create the package with all necessary files and proper configuration.
       
       - **Alternative Manual Method**:
         - Create a directory `/packages/utils-<domain>` (e.g., `/packages/utils-core` for `@coursebuilder/utils-core`).
         - Add `package.json`:
           ```json
           {
             "name": "@coursebuilder/utils-<domain>",
             "version": "1.0.0",
             "type": "module",
             "exports": {
               "./<utility-name>": {
                 "types": "./dist/<utility-name>.d.ts",
                 "import": "./dist/<utility-name>.js",
                 "default": "./dist/<utility-name>.js"
               }
             },
             "files": [
               "dist",
               "src"
             ],
             "scripts": {
               "build": "tsup",
               "dev": "tsup --watch",
               "typecheck": "tsc --noEmit",
               "test": "vitest run",
               "test:watch": "vitest"
             },
             "dependencies": {},
             "devDependencies": {
               "tsup": "8.0.2",
               "typescript": "5.4.5",
               "vitest": "1.6.0"
             }
           }
           ```
           Replace `<domain>` with the domain from the package name (e.g., `core`) and `<utility-name>` with the name of the utility (e.g., `guid`).
         - Add `tsconfig.json`:
           ```json
           {
             "compilerOptions": {
               "lib": ["dom", "dom.iterable", "esnext"],
               "allowJs": true,
               "baseUrl": ".",
               "declaration": true,
               "declarationMap": true, 
               "emitDecoratorMetadata": true,
               "experimentalDecorators": true,
               "forceConsistentCasingInFileNames": true,
               "resolveJsonModule": true,
               "allowSyntheticDefaultImports": true,
               "isolatedModules": true,
               "module": "ESNext",
               "moduleResolution": "node",
               "skipDefaultLibCheck": true,
               "skipLibCheck": true,
               "strict": true,
               "strictNullChecks": true,
               "stripInternal": true,
               "target": "es2020",
               "outDir": "dist",
               "rootDir": "src"
             },
             "include": ["src/**/*"],
             "exclude": ["node_modules", "*.js", "*.d.ts"]
           }
           ```
         - Add `tsup.config.ts`:
           ```typescript
           import { defineConfig } from 'tsup'

           export default defineConfig({
             entry: ['src/<utility-name>.ts'],
             format: ['esm'],
             dts: true,
             splitting: false,
             sourcemap: true,
             clean: true,
           })
           ```
         - Add `vitest.config.ts`:
           ```typescript
           import { defineConfig } from 'vitest/config'

           export default defineConfig({
             test: {
               environment: 'node',
               include: ['src/**/*.test.ts'],
             },
           })
           ```
         - **Verify Package Setup:**
           ```bash
           cd /packages/utils-<domain>
           pnpm i
           pnpm build
           pnpm test
           ```
           This ensures the package builds correctly and tests pass.
     - If it **exists**:
       - Use the existing package and proceed.
   - **Task:** Add the canonical utility:
     - Place the approved canonical code in `src/<utility>.ts` (e.g., `src/guid.ts`).
     - Update `package.json` to export the new utility by adding an entry to the `exports` field.
   - **Output:** Provide the full code for the package (new or updated files).
   - **[STOP FOR FEEDBACK]:** Present the package structure and utility code. Wait for approval before proceeding.

3. **Add TSdoc Comments**
   - **Action:** Add TSdoc comments to the utility in `src/<utility>.ts`.
   - **Task:** Follow these guidelines:
     - Use `/** */` for multi-line comments.
     - Start with a concise summary of the utility’s purpose.
     - Use `@param` for each parameter (name, type, purpose).
     - Use `@returns` for the return value.
     - Include `@example` where helpful.
   - **Example:** For `guid.ts`:
     ```typescript
     /**
      * Generates a globally unique identifier.
      * @returns A unique string identifier in UUID format.
      * @example
      * const id = guid(); // Returns "550e8400-e29b-41d4-a716-446655440000"
      */
     export function guid(): string {
       // Approved canonical implementation
     }
     ```
   - **Output:** Provide the utility code with TSdoc comments added.
   - **[STOP FOR FEEDBACK]:** Present the documented utility. Wait for approval before proceeding.

4. **Add Tests**
   - **Action:** Write unit tests for the utility in the shared package.
   - **Task:**
     - Place tests in `src/<utility>.test.ts` (e.g., `src/guid.test.ts`).
     - Use Jest as the testing framework.
     - Cover all functionalities and edge cases of the utility.
   - **Example:** For `guid.ts`:
     ```typescript
     import { guid } from './guid';

     describe('guid', () => {
       it('generates a unique string', () => {
         const id1 = guid();
         const id2 = guid();
         expect(id1).not.toBe(id2);
         expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
       });
     });
     ```
   - **Output:** Provide the test file code.
   - **[STOP FOR FEEDBACK]:** Present the tests. Wait for approval before proceeding.

5. **Update App Imports**
   - **Action:** Update all apps to import the utility from the shared package.
   - **Task:**
     - For each app using the local `<utility>.ts` (identified in Step 1), find import statements (e.g., `import { guid } from '@/utils/guid';`).
     - Replace with the shared package import (e.g., `import { guid } from '@coursebuilder/utils-core/guid';`).
     - Ensure import paths are correct (assume path aliases are configured if needed).
   - **Output:** Provide a list of updated import statements for each app (file path and new import code).
   - **[STOP FOR FEEDBACK]:** Present the updated imports. Wait for approval before proceeding.

---

### Phase 2: File & String Utilities
**Utilities:** `get-unique-filename.ts`, `chicagor-title.ts`

- **Instructions:** Repeat the exact same steps (1–5) as in Phase 1 for each utility.
- **Target Packages:**
  - `get-unique-filename.ts` → `@coursebuilder/utils-file`
  - `chicagor-title.ts` → `@coursebuilder/utils-string`
- **Note:** Removed `uploadthing.ts` from the plan since it depends on React, which we don't want in utils packages.

---

### Phase 3: Browser & Media Utilities
**Utilities:** `cookies.ts`, `poll-video-resource.ts`

- **Instructions:** Repeat the exact same steps (1–5) as in Phase 1 for each utility.
- **Target Packages:**
  - `cookies.ts` → `@coursebuilder/utils-browser`
  - `poll-video-resource.ts` → `@coursebuilder/utils-media`

---

### Phase 4: Service-specific Utilities
**Utilities:** `send-an-email.ts`, `aws.ts`, `openai.ts`, `get-og-image-url-for-resource.ts`, `filter-resources.ts`, `get-current-ability-rules.ts`, `typesense-instantsearch-adapter.ts`

- **Instructions:** Repeat the exact same steps (1–5) as in Phase 1 for each utility.
- **Target Packages:** See the mapping table above.

---

### Phase 5: Documentation & Usage Guidelines
**Instructions:** After completing Phases 1–4 for all utilities:

1. **Generate Package Documentation**
   - **Action:** Create a `README.md` for each shared package.
   - **Task:**
     - Include a section for each utility in the package.
     - Use the TSdoc comments from each utility to populate the documentation.
   - **Example:** For `@coursebuilder/utils-core`:
     ```markdown
     # @coursebuilder/utils-core

     Core utilities for the CourseBuilder monorepo.

     ## guid

     Generates a globally unique identifier.

     ### Returns
     A unique string identifier in UUID format.

     ### Example
     ```typescript
     const id = guid(); // Returns "550e8400-e29b-41d4-a716-446655440000"
     ```
     ```
   - **Output:** Provide the `README.md` content for each package.
   - **[STOP FOR FEEDBACK]:** Present the documentation for all packages.

2. **Update CONTRIBUTING.md**
   - **Action:** Update the monorepo’s `CONTRIBUTING.md` file.
   - **Task:**
     - Add a section titled “Shared Utilities”:
       - List all shared packages and their purposes.
       - Explain how to use them (e.g., import syntax).
       - Describe how to contribute new utilities (e.g., propose a new package or add to an existing one).
   - **Example:**
     ```markdown
     ## Shared Utilities

     Our monorepo includes shared utility packages under `/packages`:

     - `@coursebuilder/utils-core`: Core utilities like `guid`.
     - `@coursebuilder/utils-ui`: UI utilities like `cn`.

     ### Usage
     Import utilities as follows:
     ```typescript
     import { guid } from '@coursebuilder/utils-core/guid';
     ```

     ### Contributing
     To add a utility:
     1. Identify or create a suitable package.
     2. Follow the implementation steps (analysis, TSdoc, tests).
     3. Submit a PR with documentation.
     ```
   - **Output:** Provide the updated section for `CONTRIBUTING.md`.
   - **[STOP FOR FEEDBACK]:** Present the updated guidelines.

3. **Optional Central Documentation**
   - **Action:** Create a central file (e.g., `docs/shared-utilities.md`) listing all utilities.
   - **Task:** Summarize each utility and its package for quick reference.
   - **Output:** Provide the file content if generated.
   - **[STOP FOR FEEDBACK]:** Present the central documentation (if created).

---

### Additional Notes
- **Stopping for Feedback:** After each step marked **[STOP FOR FEEDBACK]**, output the results and explicitly state: “Please provide feedback or approval to proceed.” Do not continue until instructed.
- **Code Consistency:** Use camelCase for function names (e.g., `getUniqueFilename`) unless the original utility uses a different convention.
- **Placeholder Implementations:** If unable to analyze actual code, use a placeholder (e.g., `// Implementation from canonical version`) and note that it should be replaced with the approved code.
- **Error Handling:** If a step cannot be completed (e.g., missing code access), note the issue and propose a workaround, then stop for feedback.

---

**Execution Order:** Start with Phase 1, process each utility (`guid.ts`, then `cn.ts`) through all steps, then proceed to Phase 2, and so on. Complete Phase 5 last.

**Final Output:** For each utility, provide all generated code (package files, tests, updated imports). For Phase 5, provide all documentation files.

Begin processing now, starting with `guid.ts` in Phase 1, Step 1. Follow the steps exactly as outlined, and stop after each feedback point.

