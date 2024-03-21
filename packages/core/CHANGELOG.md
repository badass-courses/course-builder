# @coursebuilder/core

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
