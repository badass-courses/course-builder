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

## 03 Fork Create T3 App

Date: 2023-12-01

Status: accepted

### Context

we need specific tools for building our apps. consistency is key; we want each app to be similar. this requires a cli or generator and a template. using this setup, every new app will have the same base features.

### Decision

starting with create t3 app, well-built and decision-rich. our goal: tailor it for course-building apps. plan: fork create t3 app, integrate into our project. this base lets us develop a customized generator, leveraging t3 app's best practices.

### Consequences

forking t3 app, not just using it, means we handle updates ourselves. we can track t3's updates, but merging them won't be straightforward. we'll need to manually upgrade. this is manageable but important to remember.

## 04 Inngest for Background Jobs
Date: YYYY-MM-DD

Status: proposed

### Context
In our customer-focused environment, we deal with various automated tasks and activities behind the scenes. Key interactions, like user sign-ups or lesson progressions, necessitate automated responses such as email notifications. This demands a robust system for processing background jobs.

### Decision
We have decided to use Inngest for managing our background jobs. 
Inngest will handle the sending and processing of background tasks, offering 
impressive local development features and the reliability and durability needed for cloud-hosted services in production.

### Consequences
Opting for Inngest ties us closely to its service. While we write in 
JavaScript/TypeScript and maintain control over the application logic, 
making migration feasible, Inngest integration adds another service to our system's architecture. This increases the complexity and dependency of our overall system structure.

## 05 PlanetScale

Date: YYYY-MM-DD

Status: proposed

### Context
For our individual courses and creators, we require dedicated databases to store crucial information like user data, product details, e-commerce transactions, and user progress. Each course or creator will have their own database setup.

### Decision
We have chosen to use PlanetScale for our database needs. PlanetScale stands out with its excellent hosted service features, including speed, reliability, and a serverless architecture. It aligns well with our requirements for a database service.

### Consequences
By selecting PlanetScale, we are committing to their service. Although exporting and transferring data is possible, it makes us dependent on another external service. This entails acquiring and managing credentials, along with ongoing management throughout our products' lifespans.

## 06 Vercel

## 07 GitHub Actions