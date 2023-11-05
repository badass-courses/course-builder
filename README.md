# Media Processing with GPT-4 Chains using Inngest 🤖

This is an application that is primarily meant to be ran locally (for now) 
as a way to explore and experiment with gpt-4 prompt chaining as a "tool for 
thought"""

## TODO

- [ ] Model prompt chains in Sanity
- [ ] Use Deepgram for transcripts
- [ ] Upload media to S3
- [ ] Tagging
- [ ] Use egghead title/description/transcript data for fine-tuning/embedding

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

* an event is received
* steps/actions are performed
* we can sleep or wait for other events within the workflow
* we can send events that trigger other workflows

_[more to come]_