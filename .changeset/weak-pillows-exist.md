---
"@coursebuilder/adapter-drizzle": patch
"@coursebuilder/core": patch
"create-course-app": patch
---

adding adapter and core packages to extend the pattern that is presented by authjs to include Course Builder `contentResource` schema

this approach will allow us to maintain adapters for mysql, sqlite, and pg, potentially beyond drizzle if needed
