# Skill Recordings Course Builder POC

This is an application that is primarily meant to be ran locally (for now)
as a way to explore and experiment with gpt-4 prompt chaining as a "tool for
thought"""

Current State: https://www.loom.com/share/651287e8136a46429f46e6541e3dd0c2

## TODO

It's got a lot of moving parts 😅:

- A database to store our data
- An ORM to interact with our database
- Authentication
- Serverless Queueing
- Email sending
- Websockets
- CMS

![diagram of the stack](./public/stack.png)

As a basis we used [T3 Stack](https://create.t3.gg/) to bootstrap the
project using the NextAuth.js, Tailwind, tRPC, and Drizzle options.

Drizzle is going to use Planetscale as the database, which will allow us to
leverage edge functions.

We are using the Next.js app router. We also need email so we will use
Resend and react-email.

Additionally, we are going to use Sanity.io for our CMS. This will allow us
to create a simple CMS for defining dynamic chaining workflows and other things.

This is kind of a chore, but it's not too bad. We need to set up accounts
with:

- [Planetscale](https://planetscale.com/)
- [Stripe](https://stripe.com/)
- [Resend](https://resend.io/)
- [Sanity](https://sanity.io/)

## Getting Started

The primary goal of the app is to demonstrate how to use Inngest to generate
chained conversations with GPT-4. This approach is useful for creating
higher quality generated text that is acceptable to use for customer
communications. It's also interesting for processing text and general
exploration in the gpt-4 space.

Here's an example from a production application that's using this approach:

![flow chart of generated email workflows](./public/epic-web-flows.png)

Various events in the application trigger async workflows that occur in
queued serverless background jobs.

- an event is received
- steps/actions are performed
- we can sleep or wait for other events within the workflow
- we can send events that trigger other workflows

## Event-Driven Workflows

The application is built around the concept of event-driven workflows. There
are several kinds of events. The primary events are external to the workflow
and are emitted from users interacting with the application. The user has
requested work and provided input. When these are received, the workflow
kicks into gear and begins processing the request.

There are also external events that are generally received via webhooks when
some service provider has completed some work. For example, [when a video is
uploaded to Mux, they send a series of webhooks](https://docs.mux.com/guides/system/listen-for-webhooks) at various staging in the
video processing to let us know when the asset is available.

The receiving URL is configured within the Mux dashboard (not, for local
development we use [ngrok](https://ngrok.com/) to expose our local server.

Another example is ordering transcripts from Deepgram. When the video is
uploaded we send the URL to Deepgram for transcription and include a
callback url for Deepgram to contact when the transcript is ready.

The last kind of event is internal to the workflow. These are events that
are triggered by the workflow itself.

![diagram of events](./public/event-diagram.png)

- `VIDEO_UPLOADED_EVENT`: triggered when a new video has been uploaded and
  is available via a URL.

_[more to come]_

## Local Setup

This app can be run locally. It requires API keys for many 3rd-party services. You can get an idea of what those are from the `.env.example` file. If you have access to the Course Builder project in Vercel, you'll be able to _pull_ most of these environment variables from there. Otherwise, you'll have to set up accounts with each of the services as needed.

### Env Vars from Vercel

For those with access to the project in Vercel, here is how to grab those env vars:

- 1. Make sure you are signed in to the Vercel CLI
  - `vercel login`
- 2. Is the app/project cloned on your machine __linked__ to the corresponding project on Vercel?
  - Run `vercel env pull` and if not, it will say, `Error: Your codebase isn’t linked to a project on Vercel. Run 'vercel link' to begin.`
- 3. Link your local project to the project on Vercel
  - This step always seems like it is about to setup a fresh deployment of the app. Just make sure to carefully answer the prompts.
  - `vercel link`
    - "Set up `path/to/your/project`?" **Yes**
    - "Which scope should contain your project?" **Skill Recordings**
    - "Link to existing project?" **Yes** (note, default is No here)
    - "What's the name of your existing project?" **course-builder-poc** (check in the Vercel dashboard for the exact name of whatever project it is)
- 4. Pull the environment variables from Vercel
  - `vercel env pull`
  - At this point, the vercel CLI will have created a `.env.local` file with all of the `development` environment variables.
    - If for some reason you are needing environment variables for a different environment, you can include the `--environment` flag in the above command like so:
      - `vercel env pull --environment=preview`

### Install dependences

Make sure you have [`pnpm`](https://pnpm.io/) installed.

Then from the root project directory, install all the node dependencies:

```
$ pnpm install
```

### Set up a stable public proxy URL

[ngrok](https://ngrok.com/) is a tool that can proxy requests to and from a localhost server to a URL on the public internet. You can set up a free account and then create one-off URLs with:

```
$ ngrok http 3000
```

Note: with a free account, this URL will change each time you restart the `ngrok` command, so make sure to update it in the relevant places when that happens.

Grab this URL because you'll need it for a couple `.env` values and for the _GitHub OAuth Setup_.

Set the following URLs in your `.env`:

```
# for webhooks use ngrok or similar for stable DNS accessible URL
NEXTAUTH_URL="https://some-unique-value.ngrok-free.app"
UPLOADTHING_URL="https://some-unique-value.ngrok-free.app"
NEXT_PUBLIC_URL="https://some-unique-value.ngrok-free.app"
```

### GitHub OAuth Setup

This app uses GitHub as its OAuth provider. For local development, you'll need to create your own GitHub OAuth Application.

You can create one by visiting the [_Register a new OAuth Application_](https://github.com/settings/applications/new) and following these steps:

- 1. Give it an application name, e.g. "Bob's Local Course Builder"
- 2. Set the Homepage URL and Authorization callback URL to the `ngrok` URL you got in the previous section
- 3. No need to give a Description or check Enable Device Flow
- 4. Click 'Register Application'

You will now be dropped on your OAuth Application page where you can:

- 1. Copy the Client ID into the `GITHUB_CLIENT_ID` env var
- 2. Generate a Client Secret and copy it into the `GITHUB_CLIENT_SECRET` env var

These can both go in `.env`.

### Database Setup

This app uses Planetscale as the database provider and Drizzle as the ORM and migrator.

You'll need to set the `DATABASE_URL` in `.env` to a (non-production) Planetscale connection URL.

First, create a new database in Planetscale. Copy the connection string that you get into the `.env` file as `DATABASE_URL` and make sure that it ends with an SSL query parameter formatted as `?ssl={"rejectUnauthorized":true}`.

Then, apply the database schema to that new database with:

```
$ pnpm db:push
```

### Create an Admin User

1. Visit the `ngrok` URL in your browser
2. Click 'Sign In' and authenticate with our GitHub account
3. Via Drizzle Studio, Planetscale console, or a SQL client, find your new `user` record and change the `role` to `admin`. Make sure to save/apply the change.
4. When you visit `/tips`, you'll see the form for creating a new Tip.