---
title: Content Management
sidebar:
  order: 3
---

## Sanity

[Sanity](https://www.sanity.io/) is a headless CMS that allows us to manage our content in a structured way. It is a hosted service that provides a real-time API for reading and writing structured content. It is a great tool for managing content for websites, apps, and other digital products.

### Sanity Schemas

The core of Sanity are the schemas that define the shape of our content data 
and are written in TypeScript and committed to the repository. This allows us to
tailor the **data** to suit our needs and optimize for what we are building.

The Schemas are directly linked to our information architecture (IA) and are
designed to be flexible enough to support our needs, but rigid enough to
enforce consistency.

#### Documents vs Objects

Sanity has two types of top level data structures: Documents and Objects.

> The object type is the bread and butter of your data model. You use it to define custom types with fields of strings, numbers, and arrays, as well as other object types.
>
> By default, object types cannot be represented as standalone documents in the data store. To define an object type to represent it as a document with an ID, revision, as well as created and updated timestamps, you should define with the document type. Apart from these additional fields, there's no semantic difference between a document and an object.

[Sanity `object` docs](https://www.sanity.io/docs/object-type)
 
Course Builder separates the two types of data structures into two folders:

- `schemas/documents`
- `schemas/objects`

#### Documents

- `author`
- `concept`
- `lesson`