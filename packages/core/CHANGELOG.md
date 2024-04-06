# @coursebuilder/core

## 0.1.2

### Patch Changes

- [#146](https://github.com/badass-courses/course-builder/pull/146) [`c56c4f9`](https://github.com/badass-courses/course-builder/commit/c56c4f98836b5869b3af575ec3e55db08ca45c21) Thanks [@joelhooks](https://github.com/joelhooks)! - adds a partykit provider to core

## 0.1.1

### Patch Changes

- [#144](https://github.com/badass-courses/course-builder/pull/144) [`2b1ee5b`](https://github.com/badass-courses/course-builder/commit/2b1ee5bfddc417f5f8112f297e03b4ad8d281aa0) Thanks [@joelhooks](https://github.com/joelhooks)! - adds LLM provider (openai) to core

## 0.1.0

### Minor Changes

- [#139](https://github.com/badass-courses/course-builder/pull/139) [`7e422eb`](https://github.com/badass-courses/course-builder/commit/7e422eb3f19aa99f465f444e4180635dac5baa50) Thanks [@joelhooks](https://github.com/joelhooks)! - starts the process for migrating the `prisma-api` from Skill Stack

## 0.0.10

### Patch Changes

- [`ae2c34a`](https://github.com/badass-courses/course-builder/commit/ae2c34a8619dd4cd892bc8b2c99af3d67e9da8e7) Thanks [@joelhooks](https://github.com/joelhooks)! - remove rate limit from video upload event in inngest

## 0.0.9

### Patch Changes

- [#126](https://github.com/badass-courses/course-builder/pull/126) [`0b590f9`](https://github.com/badass-courses/course-builder/commit/0b590f984b038d951fc2bceb243415e0cf49ce20) Thanks [@joelhooks](https://github.com/joelhooks)! - updates next-auth and auth-core and gives a "session" to coursebuilder

## 0.0.8

### Patch Changes

- [#124](https://github.com/badass-courses/course-builder/pull/124) [`25df89a`](https://github.com/badass-courses/course-builder/commit/25df89a0524e8c340bbd4898fa369df3c9e2b720) Thanks [@joelhooks](https://github.com/joelhooks)! - integrates vitest for testing core and adapter-drizzle

## 0.0.7

### Patch Changes

- [`9402139f9ded1656c68daec0a422fa640f34748e`](https://github.com/badass-courses/course-builder/commit/9402139f9ded1656c68daec0a422fa640f34748e) Thanks [@joelhooks](https://github.com/joelhooks)! - adapter-drizzle now exports schemas

## 0.0.6

### Patch Changes

- [#117](https://github.com/badass-courses/course-builder/pull/117) [`e3a2ffba66ca708f9e8982d05a6d827afe57970a`](https://github.com/badass-courses/course-builder/commit/e3a2ffba66ca708f9e8982d05a6d827afe57970a) Thanks [@joelhooks](https://github.com/joelhooks)! - moves the video processing fucntions BACK to core but with a schema to keep type safety and shared context in core and consumer apps

## 0.0.5

### Patch Changes

- [#115](https://github.com/badass-courses/course-builder/pull/115) [`931b6d1c482df050eb3840f518b73e4e3204ab53`](https://github.com/badass-courses/course-builder/commit/931b6d1c482df050eb3840f518b73e4e3204ab53) Thanks [@joelhooks](https://github.com/joelhooks)! - adds the ability to create a tutorial collection, which is a flat playlist (no sections yet)

## 0.0.4

### Patch Changes

- [#113](https://github.com/badass-courses/course-builder/pull/113) [`c22006c720e7ab149ec43783aa0e3b590f92ab47`](https://github.com/badass-courses/course-builder/commit/c22006c720e7ab149ec43783aa0e3b590f92ab47) Thanks [@joelhooks](https://github.com/joelhooks)! - adds the ability to create a tutorial collection, which is a flat playlist (no sections yet)

## 0.0.3

### Patch Changes

- [#107](https://github.com/badass-courses/course-builder/pull/107) [`cc3885f3502e72873213a2fbccd58b684b653747`](https://github.com/badass-courses/course-builder/commit/cc3885f3502e72873213a2fbccd58b684b653747) Thanks [@joelhooks](https://github.com/joelhooks)! - migrates all video processing workflows into `core` for both inngest and database adapter

## 0.0.2

### Patch Changes

- [#104](https://github.com/badass-courses/course-builder/pull/104) [`2def195558d69b00ce6c1001781215c97488a99b`](https://github.com/badass-courses/course-builder/commit/2def195558d69b00ce6c1001781215c97488a99b) Thanks [@joelhooks](https://github.com/joelhooks)! - adding adapter and core packages to extend the pattern that is presented by authjs to include Course Builder `contentResource` schema

  this approach will allow us to maintain adapters for mysql, sqlite, and pg, potentially beyond drizzle if needed
