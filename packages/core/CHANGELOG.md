# @coursebuilder/core

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
