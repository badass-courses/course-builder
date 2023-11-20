---
title: Getting Started
description: This will help you create a new Course Builder project.
---

Course Builder is a Turborepo project that includes the website, this docs 
site you are reading right now, and the various libraries and packages that
represent the Course Builder platform.

:::note
This guide is a work in progress. It will be updated as the project evolves.
:::

It's non-trivial and these guides are going to make several assumptions:

- You are familiar with [Git](https://git-scm.com/)
- You are familiar with [TypeScript](https://www.typescriptlang.org/)
- You are familiar with [React](https://reactjs.org/)
- You are familiar with [Next.js](https://nextjs.org/)
- You are familiar with [Turborepo](https://turbo.build/)
- You are familiar with [pnpm](https://pnpm.io/)
- You are deploying to [Vercel](https://vercel.com/)

This is a **lot** of assumptions!

There will be plenty of detail and links, but if you are not familiar with
these technologies, you may want to start with some of the links above.

## Next.js and the T3 Stack

The Course Builder website is built with [Next.js](https://nextjs.org/). It 
uses [`create-t3-app`](https://create.t3.gg/) to scaffold the project. This 
provides a consistent opinionated starting point for Next.js projects.

- NextAuth
- TailwindCSS
- tRPC
- Drizzle ORM
- CASL

Course Builder is using the Next.js App Router which makes use of React 
Server Components.

For the sake of simplicity, Course Builder is deployed to Vercel. This might 
not be a strict requirement, but hosting on other platforms is left as an
exercise for the reader.

## Integrated Third-Party Services

Course Builder is integrated with several third-party services. These are
all currently required for the project to function. This means that you will
need to create accounts with these services and configure them for your
project by adding the various keys and secrets to your environment variables 
in the `course-builder-web` app.

- [Sanity](https://sanity.io): Content management
- [Inngest](https://inngest.com): event-driven workflows
- [Partykit](https://www.partykit.io/): Real-time updates across the system
- [Mux](https://www.mux.com/): Video delivery
- [GitHub](https://github.com/): Authentication
- [uploadthing](https://uploadthing.com): Uploading videos
- [Postmark](https://postmarkapp.com): Sending emails
- [OpenAI](https://openai.com/): AI-powered content generation

It's possible to swap these out to suit your needs and preferences, but the 
assumption in these guides is that you will be using these services.

## Clone the Repository

```bash
git clone https://www.github.com/joelhooks/course-builder
```

## Install Dependencies

```bash
pnpm install
```

## Configure Environment Variables

```bash
cd /apps/course-builder-web
cp .env.example .env
```

They are all required.

:::note
There are 3 (THREE!) different entries for the URL of the project in the 
environment:

```dotenv
NEXTAUTH_URL="YOUR_TUNNEL.ngrok-free.app/"
UPLOADTHING_URL="http://localhost:3000"
NEXT_PUBLIC_URL="https://YOUR_TUNNEL.ngrok-free.app/"
```

This is because the project is using several different services that need to
know the URL of the project. This is a bit of a pain, but it's the way it is
for now.
:::
