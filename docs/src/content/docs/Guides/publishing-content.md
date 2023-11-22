---
title: Publishing Content
description: Basic CRUD
sidebar:
  order: 2
---

Course Builder functions as an intuitive content management system, seamlessly integrated with [Sanity](https://sanity.io). Sanity serves as a robust, headless CMS, acting as the foundational content database and underlying management system for Course Builder.

## Types of Content

At its core, Course Builder employs a thoughtfully designed information architecture (IA). This IA isn't just a fancy term; it's a culmination of over a decade of research, experimentation, and refinement.

:::note
Dive deeper into the Course Builder IA [here](https://badass.dev/information-architecture). Discover how years of experience have shaped our approach.
:::

Our IA organizes content into distinct types:

- **Collections**: Defined as a `collection`, this type represents a curated set of resources tailored for an optimal learning experience.
- **Resources**: The fundamental building block of Course Builder, a `resource` forms the basis of our content. Intriguingly, a `collection` itself is a type of `resource`.

### Modules

Within Course Builder, `modules` such as Courses, Tutorials, and Workshops have designated types and functions.

- **Courses, Tutorials, and Workshops** are essentially collections of resources, primarily lessons, packaged in various formats. Despite similar data structures, they differ in terms of billing models within our product range.
- **Tutorial**: Free access content.
- **Workshop**: Paid content, offering more depth compared to tutorials.

We typically steer clear of the term "courses" due to its generic nature. The distinction between "tutorial" and "workshop" clearly communicates the value and depth of content to learners, production teams, and creators, aligning with [The Process 🌀](https://badass.dev/the-process).

### Lessons

A `lesson` is a specifically structured collection of resources. Its presentation hinges on the `type` of lesson and the organization of its constituent resources.

Common types of lessons include:

- `Tip`: Part of the `Tips` module, `Tip` lessons are organized internally and not directly visible to learners.
- `Exercise`: Integral to both `Tutorials` and `Workshops`. Exercises are more comprehensive than `Tips` or `Explainers`, comprising a problem video, a hands-on exercise, and a solution video.
- `Explainer`: Found in `Tutorials` and `Workshops`, `Explainer` lessons are similar in presentation to `Tips`, but serve as lectures within a specific module context.

This IA allows for the introduction of new lesson types tailored to specific products, offering versatility while maintaining a consistent structure.

:::note[Flexibility and Consistency]
Our IA strikes a balance between flexibility and consistency. It's designed to support the creative visions of expert creators, allowing them to convey material effectively, without compromising on uniformity and quality.
:::


### Tips

### Articles

### Tutorials

### Workshops

## Creating New Content

## Publishing Content

## Updating Content

## Removing Content
