# partykit to inngest realtime

## current blast radius
- core provider `@coursebuilder/core/providers/partykit` used by every app inngest server + tests
- `partyProvider.broadcastMessage` primarily feeds video-* pipeline (upload -> mux -> ready). resource-chat + ocr paths will be deleted during migration
- openai provider chunk streaming hits partykit endpoint with raw fetch (only needed once video ingest emits transcripts)
- ui md editor + yjs collab via `y-partykit/react` + `YPartyKitProvider`
- socket hooks per app + shared `packages/ui/hooks/use-socket` wrap `partysocket`
- env wiring `NEXT_PUBLIC_PARTY_KIT_URL` everywhere incl tests + forms + uploads
- package deps: `partykit`, `partysocket`, `y-partykit`, `@uiw/react-markdown-editor` collab config tied to yjs provider

## constraints + notes
- inngest realtime needs client + server: add `realtimeMiddleware()` and use `publish()` in handlers per docs ([source](https://www.inngest.com/docs/features/realtime))
- browser subscriptions go through token fetch and `useInngestSubscription` ([hook docs](https://www.inngest.com/docs/features/realtime/react-hooks))
- need auth guard per room because realtime tokens scoped to channel/topic
- y.js provider wiring currently dead code (no active collab consumers). safest move: delete the y-partykit + crdt plumbing instead of migrating
- provider pattern: introduce `RealtimeProvider` facade matching `broadcastMessage` contract using inngest publish so rest of code untouched until rewrite
- openai chunk streaming must publish via realtime provider (maybe new `publishChunk` util)
- kill envs `NEXT_PUBLIC_PARTY_KIT_URL`, replace with inngest envs (`INNGEST_BASE_URL`, etc.)
- remove dev scripts `pnpx partykit dev`
- target success metric: video upload -> mux ready notifications delivered via realtime with <1s added latency, zero prod regressions, legacy path removable without incident
- rollback plan: feature flag + configuration toggle per env. disabling realtime immediately reverts to partykit broadcast + sockets

## go forward plan
**difficulty:** very high (touches every app + shared infra, replaces realtime transport + env)  
**risk:** high but containable if phased (keep partykit + realtime coexistence until traffic flipped)

### risk mitigation guardrails (execute before/during rollout)
- pilot on lowest-traffic app first (e.g. `apps/astro-party`) before touching flagship apps
- keep realtime in shadow mode initially: publish to realtime but keep UI on partykit; verify parity via logs
- add per-channel feature flags (`ENABLE_REALTIME_VIDEO_UPLOAD`, `...READY`, `...TRANSCRIPT`) for granular rollouts
- record/playback representative video events in staging to validate realtime output against partykit baseline
- set up dashboards + alerts (publish failure count, latency, token errors) prior to enabling realtime for users
- run codemods on throwaway branch + CI before merging; manual diff review required
- document toggle + rollback runbook; conduct oncall rehearsal so rollback is muscle memory

0. **codemod prep**
   - scriptable swaps: import renames (`PartykitProvider` -> `RealtimeProvider` placeholder), env var rename (`NEXT_PUBLIC_PARTY_KIT_URL` -> `NEXT_PUBLIC_REALTIME_URL`), removing `dev:party` scripts. prep jscodeshift transforms + tests ([martinfowler.com/articles/codemods-api-refactoring.html](https://martinfowler.com/articles/codemods-api-refactoring.html))
   - create lint rule (eslint or ts) flagging direct `partykit` imports to stop regressions
   - dry-run codemods on `packages/core` + `apps/astro-party` first, review diff, document revert instructions

1. **dual provider foundation**
   - add `packages/core/providers/realtime.ts` exporting `RealtimeProvider(options)` mirroring `PartyProviderConfig` signature but delegating to `@inngest/realtime`
   - rename existing party provider to `LegacyPartyProvider` and keep factory exported for now
   - extend `CoreInngestContext` to expose both `realtimeProvider` (new) and `partyProvider` (legacy). mark legacy deprecated
   - update `createInngestMiddleware` to accept optional `{ realtimeProvider, partyProvider }`, defaulting realtime to noop publisher that logs when not configured

2. **bootstrap realtime without breaking party**
   - create shared helper `createRealtimeClient({ id, middleware, logger })` returning ingress-ingest client + `publish` util. lives in `packages/core/realtime`
   - in each app’s `inngest.server.ts`, instantiate realtime client (gated behind env flag) and pass into middleware while keeping `partyProvider: LegacyPartyProvider(...)`
   - add health check function to confirm realtime publish works (ping channel) but swallow errors so party fallback still runs
   - document required env vars + secrets per deployment target; ensure infrastructure team provisions them before enabling flag

3. **gradual server migration (video-first)**
   - delete resource-chat + ocr handlers up front (remove events + party broadcast usage) to shrink blast radius
   - build `broadcastMessage` adapter that multicasts to both providers when realtime flag on. centralize in `packages/core/providers/broadcast.ts`
   - refactor only video pipeline handlers (`video-uploaded`, `video-ready`, `video-processing-error`, `transcript-ready`, etc.) to call adapter. party-only behavior preserved until flip
   - instrument logs to track success/failure per channel (structured logging for publish latency + error)
   - gate openai streaming publisher: on flag, buffer chunks -> realtime publish; otherwise use existing party fetch
   - add feature flag env per app `ENABLE_REALTIME_VIDEO_REALTIME` (video scope only) for phased rollout per environment
   - add canary test: e2e job uploads small clip and asserts realtime notification received via new provider while party fallback still active

4. **client integration in parallel**
   - introduce `packages/ui/realtime` with `getRealtimeToken` types + `useRealtimeSubscription` wrapper (calls `useInngestSubscription` when available, otherwise falls back to noop + party socket). this keeps UI working mid-migration
   - build unified token endpoint per app: `GET /api/realtime/token` hitting Inngest `getSubscriptionToken`. behind flag, else respond 404 so party clients continue
   - replace `usePartySocket` hooks with wrapper that checks feature flag: if realtime enabled, use hook; else fall back to existing partysocket implementation until removed
   - rip out unused y.js collab components entirely in same sweep (kill imports, state). reduces future conflicts
   - add smoke test to verify client fallback: when realtime disabled, hook still returns party socket connection (temporary) so UI unaffected

5. **cutover plan**
   - stage env rollout: dev -> staging -> prod per app. enable realtime flag, monitor publish metrics + client subscription state. fallback switch to disable if issues
   - once stable, stop multicasting: switch adapter to realtime-only, remove legacy provider wiring from middleware
   - codemod to delete leftover party imports + env usage; remove deps from package manifests
   - maintain communication log: note date/time per environment flip, include metrics snapshot + any anomalies

6. **cleanup + docs**
   - update plan docs, READMEs, env sample files with realtime instructions
   - delete resource-chat + ocr code paths from core + apps once cutover complete
   - delete `LegacyPartyProvider`, old hooks, env vars. ensure lint rule prevents reintroduction
   - add regression tests: mock realtime publish in core integration tests (video pipeline focus); add client hook tests verifying fallback behavior
   - testing matrix:
     - **unit (vitest):** provider adapter emits correct payload shape, feature flag toggles fall back cleanly, token fetch util handles expiry
     - **integration (vitest + mocked ctx):** simulate video upload event -> confirm both party + realtime publish, assert flag toggles stop legacy path
     - **integration (app-level vitest):** exercise Next.js server action for token endpoint with mocked inngest SDK and ensure client hook receives messages
     - **manual smoke:** run video upload against dev env verifying realtime + fallback behavior until dedicated e2e harness exists
   - update oncall playbook with realtime troubleshooting guide (token refresh failure, publish error recovery)

7. **post-migration follow-ups**
   - purge y.js packages + revisit collaborative editing solution if needed later
   - review cost/limits for realtime usage; set alerts on publish error rate
   - retire codemod + flag once repo clean

## execution order cheat sheet
- phase a: provider + middleware updates in core
- phase b: app inngest servers + openai streaming swap
- phase c: client hook migration + UI adjustments
- phase d: env + dependency cleanup
- phase e: docs/tests/regression pass (`pnpm test --filter core`, impacted apps)

