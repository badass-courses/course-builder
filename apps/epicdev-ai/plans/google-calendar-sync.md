# Plan: Google Calendar Sync via Inngest

**Owner:** @joelhooks
**Status:** Proposed

## 1. Goal

Automate the creation and updating of Google Calendar events corresponding to `event` type Content Resources within the application. Utilize Inngest to handle asynchronous operations triggered by resource creation and updates.

## 2. Define New Inngest Events (`apps/epicdev-ai/src/inngest/events/resource-management.ts`)

- Create a new file `apps/epicdev-ai/src/inngest/events/resource-management.ts`.
- Define `RESOURCE_CREATED_EVENT = 'resource/created'` constant.
- Define generic payload type `ResourcePayloadData = { id: string; type: string; }`.
- Define event type `ResourceCreated = { name: typeof RESOURCE_CREATED_EVENT; data: ResourcePayloadData; }`.
- Define `RESOURCE_UPDATED_EVENT = 'resource/updated'` constant.
- Define event type `ResourceUpdated = { name: typeof RESOURCE_UPDATED_EVENT; data: ResourcePayloadData; }`.
- Register these new event constants and payload types in the `Events` type definition within `apps/epicdev-ai/src/inngest/inngest.server.ts`.

## 3. Dispatch Inngest Events

- **On Create (`apps/epicdev-ai/src/lib/resources/create-resources.ts`):**
    - Import `inngest` client from `../../inngest/inngest.server`.
    - Import `RESOURCE_CREATED_EVENT` constant.
    - After `const parsedResource = ContentResourceSchema.safeParse(resource)`:
    - If `parsedResource.success`, send the generic event: `await inngest.send({ name: RESOURCE_CREATED_EVENT, data: { id: parsedResource.data.id, type: parsedResource.data.type } })`.
- **On Update (`apps/epicdev-ai/src/lib/resources-query.ts`):**
    - Import `inngest` client from `../inngest/inngest.server`.
    - Import `RESOURCE_UPDATED_EVENT` constant.
    - After successfully fetching the `updatedResource`:
    - Send the generic event: `await inngest.send({ name: RESOURCE_UPDATED_EVENT, data: { id: updatedResource.id, type: updatedResource.type } })`.

## 4. Enhance Google Calendar Library (`apps/epicdev-ai/src/lib/google-calendar.ts`)

- **Add `getGoogleCalendarEvent` function:**
    - Signature: `async function getGoogleCalendarEvent(calendarEventId: string): Promise<calendar_v3.Schema$Event | null>`
    - Authenticates using `env.GOOGLE_CALENDAR_IMPERSONATE_USER`.
    - Uses `calendar.events.get({ calendarId: 'primary', eventId: calendarEventId })`.
    - Includes try/catch to handle 404 errors (return `null`), re-throw other errors.
- **Add `updateGoogleCalendarEvent` function:**
    - Signature: `async function updateGoogleCalendarEvent(calendarEventId: string, eventDetails: Partial<calendar_v3.Schema$Event>): Promise<calendar_v3.Schema$Event>`
    - Authenticates using `env.GOOGLE_CALENDAR_IMPERSONATE_USER`.
    - Uses `calendar.events.patch({ calendarId: 'primary', eventId: calendarEventId, requestBody: eventDetails })`.
    - Returns `response.data`.
    - Includes try/catch to re-throw errors with more context.
- **Refactor `createGoogleCalendarEvent`:**
    - Update signature: `async function createGoogleCalendarEvent(eventDetails: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event>` (remove `userToImpersonate` parameter).
    - Update authentication logic inside to use `env.GOOGLE_CALENDAR_IMPERSONATE_USER`.
- **Environment Variable:** Add `GOOGLE_CALENDAR_IMPERSONATE_USER` to `env.mjs` (see step 7).

## 5. Implement `calendar-sync` Inngest Function (`apps/epicdev-ai/src/inngest/functions/calendar-sync.ts`)

- Create the file `apps/epicdev-ai/src/inngest/functions/calendar-sync.ts`.
- Import `inngest` from `../inngest.server`.
- Import `createGoogleCalendarEvent`, `getGoogleCalendarEvent`, `updateGoogleCalendarEvent` from `../../lib/google-calendar`.
- Import `courseBuilderAdapter` for updating resources.
- Import `RESOURCE_CREATED_EVENT`, `RESOURCE_UPDATED_EVENT` constants and `ResourceCreated`, `ResourceUpdated` types.
- Import `EventSchema`, `Event` type from `../../lib/events`.
- Import `env` from `../../env.mjs`.
- Define function: `export const calendarSync = inngest.createFunction(...)`
    - `id: 'calendar-sync'`
    - `name: 'Google Calendar Sync for Events'`
    - Trigger: `[{ event: RESOURCE_CREATED_EVENT, if: "event.data.type == 'event'" }, { event: RESOURCE_UPDATED_EVENT, if: "event.data.type == 'event'" }]`
    - `handler: async ({ event, step }) => { ... }`
- **Handler Logic:**
    - `const resourceId = event.data.id;`
    - Fetch the full event resource: `const eventResource = await step.run('fetch-event-resource', async () => await courseBuilderAdapter.getContentResource(resourceId));`
    - `if (!eventResource) throw new NonRetriableError(`Event resource not found: ${resourceId}`);`
    - `const validation = EventSchema.safeParse(eventResource);`
    - `if (!validation.success) throw new NonRetriableError('Invalid event resource format: ' + validation.error.message);`
    - `const validEventResource = validation.data;`
    - `const calendarId = validEventResource.fields.calendarId;`
    - `const googleEventPayload = { /* Map fields: summary, description, start, end, timeZone */ };`
    - `if (!env.GOOGLE_CALENDAR_IMPERSONATE_USER) throw new Error('GOOGLE_CALENDAR_IMPERSONATE_USER not configured');`
    - **If `calendarId` exists:**
        - `await step.run('update-google-event', async () => { await updateGoogleCalendarEvent(calendarId, googleEventPayload); });` (Add error handling)
    - **If `calendarId` does not exist:**
        - `const createdGoogleEvent = await step.run('create-google-event', async () => { return await createGoogleCalendarEvent(googleEventPayload); });`
        - `if (createdGoogleEvent?.id) { await step.run('update-resource-with-calendar-id', async () => { await courseBuilderAdapter.updateContentResourceFields({ id: validEventResource.id, fields: { ...validEventResource.fields, calendarId: createdGoogleEvent.id } }); }); }` (Add error handling)

## 6. Register Inngest Function (`apps/epicdev-ai/src/inngest/inngest.config.ts`)

- Import `calendarSync` function.
- Add `calendarSync` to the `functions` array.

## 7. Environment Variables (`apps/epicdev-ai/src/env.mjs`)

- Add `GOOGLE_CALENDAR_IMPERSONATE_USER: z.string()` to `server` schema and `runtimeEnv`.
- **Decision:** Should `GOOGLE_CREDENTIALS_JSON` be required? Change from `.optional()` back to `.string()` if this sync is mandatory.

## 8. Future Steps (Attendee Management)

- Define events (`TICKET_PURCHASED`, `TICKET_REFUNDED`, etc.).
- Add Google Calendar API functions for managing attendees to `google-calendar.ts`.
- Create separate Inngest functions triggered by commerce events to call attendee management functions. 