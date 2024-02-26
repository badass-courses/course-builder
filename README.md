# Course Builder

Course Builder is a real-time multiplayer CMS for building and deploying the opinionated data structures of developer education products

The main Course Builder web application can be found in `apps/course-builder-web` and has further instructions in the readme.

This is a monorepo managed by [Turborepo](https://turbo.build/)

## Getting Started

```bash
pnpm install
pnpm build
cd apps/course-builder-web
cp .env.example .env
pnpm dev
```

All of the environment variables for various services are the biggest obstacle to getting started. You can find the environment variables in the `apps/course-builder-web/.env` file. You can copy the `apps/course-builder-web/.env.example` file to `.env` and fill in the values for the environment variables.

Built by [Badass Courses 🍄🌈💀](https://badass.dev)
