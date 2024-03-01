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

## 13 Prefer Server Actions Over TRPC

Date: 2024-03-01

Status: proposed

### Context

We are currently using TRPC for api style actions, which has served us well. However, we are considering switching to server actions as our primary method for handling server-side logic.

### Decision

We have decided to prefer server actions over TRPC. This decision aligns with our goal to simplify our codebase and reduce dependencies. By using server actions, we can take advantage of the built-in Next.js features, which are easy to set up and maintain. This approach also allows us to keep our server-side logic close to our frontend code, making it easier to manage and maintain.

## 12 Use a Single Table for Content Resources

Date: 2024-02-29

Status: proposed

### Context

Our content resources, such as courses, lessons, and articles, we traditionally stored in separate tables in our database. This approach has led to complex queries and joins, making it challenging to manage and retrieve content efficiently as well as forcing us into a "known set of content types". 

We are considering using a single table to store all content resources called `contentResources`, which could simplify our data model and allow for a lot of flexibility.

a content resource will carry `metadata` and `resources` that can be shaped via schemas for specific content types.

This will allow individual sites/products to define their own content types and schemas, and we can store all content resources in a single location, making it easier to manage and retrieve content efficiently.

### Decision

We have decided to use a single table to store all content resources. This decision aligns with our goal to simplify our data model and allow for a lot of flexibility. By using a single table, we can store all content resources in a single location, making it easier to manage and retrieve content efficiently.

## 11 Migrate from Sanity to Course Builder as CMS

Date: 2024-02-29

Status: proposed

### Context

Our content management system (CMS) is a critical part of our infrastructure, enabling us to manage and deliver content to our users. We currently use Sanity as our CMS, but we are considering migrating to Course Builder as our primary CMS.

Important to note that we will NOT be a CDN for images and videos. We will use a third-party service for that.

### Decision

We have decided to migrate from Sanity to Course Builder as our CMS. This decision aligns with our goal to consolidate our infrastructure and reduce dependencies on external services. By using Course Builder as our CMS, we can take advantage of its seamless integration with our existing infrastructure, including our database, authentication, and other services.

## 10 Use CodeMirror for Text Editing in Browser

Date: 2023-12-18

Status: proposed

### Context
Content creation, particularly text editing, is a significant aspect of our process, essential for user experience, SEO, and overall content quality. Text editing is primarily conducted in the browser, and we face a choice between different types of text editors. Options include real-time 'What You See Is What You Get' (WYSIWYG) editors, which provide rich text formatting, and plain text editors that support markdown syntax directly.

### Decision
We are considering using CodeMirror as our primary text editor. CodeMirror stands out for its seamless editing experience, which can be further enhanced with various tools and extensions. Its capability to provide crisp typing experiences combined with real-time editing features, potentially integrated with Party Kit, offers a robust and scalable editing system. This setup would enable first-class markdown editing directly in the browser, contributing to an integrated content environment.

### Consequences
Opting for CodeMirror involves a commitment to a specific type of text editing interface, which may limit flexibility in terms of rich text features typically found in WYSIWYG editors. However, the advantages of enhanced markdown support and the ability to extend functionality with tools and extensions present significant benefits for our content creation process. This decision will impact how we manage and edit text content, affecting user experience and content management efficiency.


## 09 Use Axiom for Log Management

Date: 2023-12-14

Status: proposed

### Context
Our application requires comprehensive logging, including the distribution and long-term storage of logs for analysis. We need a solution that allows us to inspect logs over extended periods, especially in critical processes like e-commerce transactions. Vercel's logging capabilities are limited in duration and deployment scope.

### Decision
We have decided to trial Axiom as our logging service provider. Axiom is recognized for its ability to intake, search, and sort through logs effectively. It offers an affordable solution for extensive logging needs and is compatible with our current system architecture.

### Consequences
Choosing Axiom introduces a new service into our system, adding to the complexity and maintenance requirements. There's an associated cost, although Axiom is relatively affordable. Implementing Axiom requires instrumenting our application to send logs appropriately, including setting up loggers and wrapping route handlers. While Axiom provides a Next.js library for integration, we'll need to evaluate its effectiveness and may explore other log drain methods in the future.

## 08 GitHub Actions for CI/CD

Date: 2023-12-05

Status: proposed

### Context
Continuous Integration (CI) and Continuous Deployment (CD) are crucial for efficient project management. While various platforms offer CI/CD services, our choice is influenced by our use of Next.js and the platform's integration with these services.

### Decision
We've decided to leverage GitHub Actions for our CI/CD needs. This aligns with our deployment on GitHub, offering built-in support and accessibility. Our focus is on robust CI/CD from the outset with our course builder platform, involving linting, testing, running end-to-end tests, and staging deployments.

### Consequences
Using GitHub Actions enables frequent, manageable deployments with rollback capabilities. However, it does come with a learning curve, particularly in setting up and testing the actions initially. Once established, it should require minimal adjustment. Another aspect to consider is the ongoing maintenance of these actions.
Adjust the date and status to match the current stage of this decision.

## 07 Drizzle ORM for Database Interface

Date: 2023-12-05

Status: accepted

### Context
Interfacing with databases requires an efficient Object-Relationship Manager (ORM). ORMs provide a code-level, TypeScript-friendly API for interacting with database entities. We considered various ORMs, including Prisma, and evaluated their fit in our system.

### Decision
We have chosen to try Drizzle ORM as an alternative to Prisma. Drizzle's approach to TypeScript integration is appealing because it does not generate a client like Prisma, which aligns more closely with our code ownership philosophy. It also simplifies asset management in our monorepo structure and offers intriguing edge capabilities, especially when combined with PlanetScale.

### Consequences
Using Drizzle ORM brings us closer to our own code ownership, reducing the need for significant asset generation. However, integrating any ORM deeply intertwines it with our system. We need to consider creating an additional layer, like a facade, SDK, or API layer, between the ORM and our application to manage this integration effectively.
Adjust the date and status as needed.

## 06 Host on Vercel

Date: 2023-12-05

Status: accepted

### Context
There are numerous hosting options for applications, each with its own trade-offs. Options include AWS, Render, Heroku, and others. Our key consideration is the development framework we use, Next.js, which is developed by Vercel.

### Decision
We have decided to host our Next.js applications on Vercel. This choice offers the least friction and enables us to utilize the full potential of Next.js, especially its latest features. Vercel's hosting aligns well with Next.js, as they are both developed by the same company.

### Consequences
Choosing Vercel as our hosting provider does come with trade-offs. It locks us into a specific vendor, making us reliant on their methodologies and updates. However, this is not a significant issue as Vercel's approaches align with our application development strategies.

## 05 PlanetScale

Date: 2023-12-05

Status: accepted

### Context
For our individual courses and creators, we require dedicated databases to store crucial information like user data, product details, e-commerce transactions, and user progress. Each course or creator will have their own database setup.

### Decision
We have chosen to use PlanetScale for our database needs. PlanetScale stands out with its excellent hosted service features, including speed, reliability, and a serverless architecture. It aligns well with our requirements for a database service.

### Consequences
By selecting PlanetScale, we are committing to their service. Although exporting and transferring data is possible, it makes us dependent on another external service. This entails acquiring and managing credentials, along with ongoing management throughout our products' lifespans.

## 04 Inngest for Background Jobs

Date: 2023-12-05

Status: accepted

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

## 03 Fork Create T3 App

Date: 2023-12-01

Status: accepted

### Context

we need specific tools for building our apps. consistency is key; we want each app to be similar. this requires a cli or generator and a template. using this setup, every new app will have the same base features.

### Decision

starting with create t3 app, well-built and decision-rich. our goal: tailor it for course-building apps. plan: fork create t3 app, integrate into our project. this base lets us develop a customized generator, leveraging t3 app's best practices.

### Consequences

forking t3 app, not just using it, means we handle updates ourselves. we can track t3's updates, but merging them won't be straightforward. we'll need to manually upgrade. this is manageable but important to remember.

## 02 Next.js and Turborepo

Date: 2023-11-26

Status: accepted

### Context

To keep things consistent we generally build applications using TurboRepo and Next.js. This gives us a consistent structure across all of our applications and speaks well to the decision to use TypeScript as the basis.

### Decision

For now, Course Builder is going to stick with Next.js and TurboRepo as the solution that we choose.

### Consequences

One of the problems with this decision is that it makes it more difficult to use other systems that people might prefer. If somebody likes remix, for example, it's going to be difficult to make use of CourseBuilder as it is today. For that reason, this decision might actually change in the future and we might use something totally different or make it more generic or evolve it into something that is more representative of the wider field of options. But for now, we're sticking with Next.js and TurboRepo.

## 01 TypeScript

Date: 2023-11-26

Status: accepted

### Context

All the tools and utilities that we use to build websites are TypeScript based at the level that we're using them. Some other languages might be used to deliver those tools, but for our purposes TypeScript is the language of choice.

### Decision

This decision is de facto. The repository is TypeScript and it's the language that we are going to use.

### Consequences

One of the problems when you choose a language is that other people might have different opinions about which language is the best to use. In some cases, people might not like TypeScript, and in those cases, it's fine for them to choose something else, but they won't be able to use Course Builder.









