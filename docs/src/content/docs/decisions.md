---
title: Decisions
description: How we got here.
sidebar:
  order: 101
---

Here is the template for a new decision:

```markdown
## Title

Date: YYYY-MM-DD

Status: proposed | rejected | accepted | deprecated | … | superseded by
[0005](#0005-example)

### Context

### Decision

### Consequences
```

## 01 TypeScript

Date: 2023-11-26

Status: accepted

### Context

All the tools and utilities that we use to build websites are TypeScript based at the level that we're using them. Some other languages might be used to deliver those tools, but for our purposes TypeScript is the language of choice.

### Decision

This decision is de facto. The repository is TypeScript and it's the language that we are going to use.

### Consequences

One of the problems when you choose a language is that other people might have different opinions about which language is the best to use. In some cases, people might not like TypeScript, and in those cases, it's fine for them to choose something else, but they won't be able to use Course Builder.

## 02 Next.js and Turborepo

Date: 2023-11-26

Status: accepted

### Context

To keep things consistent we generally build applications using TurboRepo and Next.js. This gives us a consistent structure across all of our applications and speaks well to the decision to use TypeScript as the basis.

### Decision

For now, Course Builder is going to stick with Next.js and TurboRepo as the solution that we choose.

### Consequences

One of the problems with this decision is that it makes it more difficult to use other systems that people might prefer. If somebody likes remix, for example, it's going to be difficult to make use of CourseBuilder as it is today. For that reason, this decision might actually change in the future and we might use something totally different or make it more generic or evolve it into something that is more representative of the wider field of options. But for now, we're sticking with Next.js and TurboRepo.

## 03 Stripe

## 04 Sanity

## 05 PlanetScale

## 06 Vercel

## 07 GitHub Actions