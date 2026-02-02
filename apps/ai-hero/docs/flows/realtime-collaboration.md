# Real-time Collaboration Flow (PartyKit + Yjs)

## Overview

AI-Hero implements real-time collaborative editing using PartyKit as the WebSocket server and Yjs for Conflict-free Replicated Data Types (CRDT). This enables multiple users to edit content simultaneously with automatic conflict resolution and persistence to PlanetScale database.

**Key Components:**
- **PartyKit Server**: WebSocket server handling connections and document lifecycle
- **Yjs**: CRDT library for conflict-free document synchronization
- **y-partykit**: Binding layer between PartyKit and Yjs
- **PlanetScale**: Database for persistent storage of Yjs documents
- **partysocket/react**: React hook for client-side WebSocket connections

**Configuration:**
- Server: `party/index.ts`
- Config: `partykit.json` (team: skillrecordings, compat: 2023-10-20)
- Host: `env.NEXT_PUBLIC_PARTY_KIT_URL`
- Room: Resource ID or slug (e.g., post ID)

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Component]
        B[useSocket Hook]
        C[PartySocket Client]
    end

    subgraph "PartyKit Server"
        D[Party.Server]
        E[y-partykit Provider]
        F[Yjs Document]
        G[Party Storage]
    end

    subgraph "Persistence Layer"
        H[PlanetScale DB]
        I[contentResource Table]
    end

    A -->|Uses| B
    B -->|Creates| C
    C -->|WebSocket| D
    D -->|onConnect| E
    E -->|Manages| F
    F -->|Snapshot| G
    D -->|load| H
    H -->|fields.yDoc| I
    D -->|callback| H

    style D fill:#ff6b6b
    style F fill:#4ecdc4
    style H fill:#ffe66d
```

**Legend:**
- Red: PartyKit Server
- Teal: Yjs Layer
- Yellow: Database

---

## Connection Lifecycle Sequence

```mermaid
sequenceDiagram
    participant Client as React Client
    participant Hook as useSocket
    participant PS as PartySocket
    participant PKS as PartyKit Server
    participant DB as PlanetScale

    Client->>Hook: useSocket({ room: postId })
    Hook->>PS: new PartySocket(host, room)
    PS->>PKS: WebSocket CONNECT

    activate PKS
    PKS->>PKS: onConnect(conn, ctx)
    Note over PKS: Log connection<br/>(id, room, url)

    PKS->>DB: Query contentResource
    Note over DB: SELECT WHERE<br/>slug = roomId OR<br/>id = roomId
    DB-->>PKS: Return resource

    alt yDoc exists in DB
        PKS->>PKS: new Y.Doc()
        PKS->>PKS: Buffer.from(yDoc, 'base64')
        PKS->>PKS: Y.applyUpdate(doc, update)
        Note over PKS: Restore document state
    else yDoc missing, body exists
        PKS->>PKS: doc.getText('codemirror')
        PKS->>PKS: insert(0, body)
        Note over PKS: Initialize from plain text
    else No content
        PKS->>PKS: return new Y.Doc()
        Note over PKS: Empty document
    end

    PKS->>PS: y-partykit provider ready
    PS-->>Client: onOpen event
    deactivate PKS

    Note over Client,PKS: Connection established<br/>Ready for sync
```

---

## Yjs Document Synchronization

```mermaid
sequenceDiagram
    participant U1 as User 1 Editor
    participant Y1 as User 1 Yjs Doc
    participant PKS as PartyKit Server
    participant Y2 as User 2 Yjs Doc
    participant U2 as User 2 Editor

    Note over U1,U2: Both users connected

    U1->>Y1: Insert text: "Hello"
    Y1->>Y1: Generate operation
    Y1->>PKS: Send Yjs update (binary)

    PKS->>PKS: Apply to server Yjs Doc
    Note over PKS: CRDT merge<br/>No conflicts

    PKS->>Y2: Broadcast update
    Y2->>Y2: Apply update
    Y2->>U2: Update editor view

    rect rgb(240, 240, 240)
        Note over U1,U2: Concurrent Edits

        U1->>Y1: Insert " World" at pos 5
        U2->>Y2: Insert "Hi " at pos 0

        par Parallel Operations
            Y1->>PKS: Update A
            Y2->>PKS: Update B
        end

        PKS->>PKS: CRDT merge both ops
        Note over PKS: Final: "Hi Hello World"

        PKS->>Y1: Broadcast merged state
        PKS->>Y2: Broadcast merged state

        Y1->>U1: Display: "Hi Hello World"
        Y2->>U2: Display: "Hi Hello World"
    end

    Note over U1,U2: Conflict-free convergence
```

---

## Conflict Resolution Flow

```mermaid
flowchart TD
    A[User Edit] --> B{Generate Yjs Op}
    B --> C[Encode to Update]
    C --> D[Send to PartyKit]

    D --> E{Server Processing}
    E --> F[Apply to Server Doc]
    F --> G{Conflict?}

    G -->|No| H[Broadcast to Others]
    G -->|Yes| I[CRDT Merge]

    I --> J{Merge Strategy}
    J -->|Concurrent Insert| K[Position Transform]
    J -->|Concurrent Delete| L[Tombstone]
    J -->|Edit + Delete| M[Delete Wins]

    K --> H
    L --> H
    M --> H

    H --> N[Other Clients Apply]
    N --> O[Update Local Yjs Doc]
    O --> P[Render in Editor]

    style I fill:#ff6b6b
    style J fill:#4ecdc4
    style K fill:#95e1d3
    style L fill:#95e1d3
    style M fill:#95e1d3
```

**CRDT Rules:**
- **Concurrent Inserts**: Position-based transformation maintains both edits
- **Concurrent Deletes**: Tombstone markers prevent data loss
- **Edit + Delete conflict**: Delete operation takes precedence
- **Convergence**: All clients reach identical state after applying all operations

---

## Connection State Machine

```mermaid
stateDiagram-v2
    [*] --> Disconnected

    Disconnected --> Connecting: WebSocket.connect()
    Connecting --> Connected: onOpen
    Connecting --> Error: Connection Failed

    Connected --> Syncing: Load Yjs Doc
    Syncing --> Synced: Initial Sync Complete

    Synced --> Broadcasting: Local Edit
    Broadcasting --> Synced: Update Sent

    Synced --> Receiving: Remote Update
    Receiving --> Synced: Applied

    Connected --> Disconnected: Close
    Error --> Disconnected: Retry
    Synced --> Error: Network Issue

    note right of Syncing
        Load from DB
        Apply yDoc or body
        Initialize y-partykit
    end note

    note right of Broadcasting
        Generate Yjs update
        Send via WebSocket
        CRDT merge on server
    end note
```

---

## Persistence Flow

```mermaid
sequenceDiagram
    participant Client as Editor Client
    participant PKS as PartyKit Server
    participant YDoc as Yjs Document
    participant DB as PlanetScale
    participant Auto as Autosave Handler

    Note over Client,DB: Document Editing Session

    Client->>PKS: Edit operations
    PKS->>YDoc: Apply updates

    loop Continuous Editing
        Client->>PKS: More edits
        PKS->>YDoc: Apply
    end

    rect rgb(255, 240, 240)
        Note over Auto: Autosave Trigger<br/>(callback.handler)

        Auto->>YDoc: Get current state
        YDoc->>Auto: Y.encodeStateAsUpdate(doc)
        Auto->>Auto: Buffer.toString('base64')

        Auto->>DB: UPDATE contentResource
        Note over DB: SET fields.yDoc<br/>WHERE id = roomId
        DB-->>Auto: Success
    end

    Note over Client,DB: Automatic persistence<br/>No explicit save needed
```

**Autosave Details:**
- Triggered via `callback.handler` in y-partykit config
- Encodes Yjs document state to binary
- Stores as base64 string in `fields.yDoc`
- Currently configured but handler is empty (placeholder for future implementation)

---

## HTTP API Endpoints

```mermaid
graph LR
    subgraph "PartyKit HTTP API"
        A[GET /parties/main/:room]
        B[POST /parties/main/:room]
        C[OPTIONS /parties/main/:room]
    end

    A -->|Fetch| D[Room State]
    B -->|Broadcast| E[Message to All]
    C -->|CORS| F[Preflight OK]

    D --> G[{"{ users: [] }"}]
    E --> H[party.broadcast]
    F --> I[CORS Headers]

    style A fill:#4ecdc4
    style B fill:#ff6b6b
    style C fill:#ffe66d
```

**Endpoint Details:**

### GET `/parties/main/:room`
```typescript
// Returns current room state
// Currently returns empty users array
// CORS enabled for SSR
Response: { users: [] }
Headers: Access-Control-Allow-Origin: *
```

### POST `/parties/main/:room`
```typescript
// Broadcast message to all connections
Body: {
  requestId: string
  body: string
  name: string
}

// Broadcasts via party.broadcast()
// Returns message count
```

### OPTIONS `/parties/main/:room`
```typescript
// CORS preflight
// Required for cross-origin requests
Response: { ok: true }
```

---

## Message Broadcasting Flow

```mermaid
sequenceDiagram
    participant C1 as Client 1
    participant PKS as PartyKit Server
    participant C2 as Client 2
    participant C3 as Client 3
    participant Router as Next.js Router

    C1->>PKS: POST with event data
    Note over C1: Event: "video.asset.ready"

    PKS->>PKS: party.broadcast(message)

    par Broadcast to All
        PKS->>C1: WebSocket message
        PKS->>C2: WebSocket message
        PKS->>C3: WebSocket message
    end

    C1->>C1: onMessage handler
    Note over C1: Check invalidateOn array

    alt Event in invalidateOn
        C1->>Router: router.refresh()
        Note over Router: Refetch data<br/>Update UI
    else Ignore
        C1->>C1: No action
    end

    Note over C1,C3: All clients stay in sync
```

**Event System:**
- Events broadcast via HTTP POST to PartyKit
- `Party` component listens via `useSocket`
- Specific events trigger router refresh:
  - `videoResource.created`
  - `video.asset.ready`
  - `transcript.ready`
  - `ai.tip.draft.completed`
  - `video.asset.detached`
  - `video.asset.attached`

---

## Client Integration Pattern

```typescript
// Hook wrapper for PartySocket
// src/hooks/use-socket.ts
export function useSocket(options: {
  room?: string | null
  onOpen?: (event) => void
  onMessage?: (event) => void
  onClose?: (event) => void
  onError?: (event) => void
}) {
  return usePartySocket({
    host: env.NEXT_PUBLIC_PARTY_KIT_URL,
    room: options.room || env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
    ...options
  })
}

// Component usage
// src/components/party.tsx
export function Party({ room }: { room?: string }) {
  const router = useRouter()
  const utils = api.useUtils()

  useSocket({
    room,
    onMessage: async (messageEvent) => {
      const data = JSON.parse(messageEvent.data)
      if (invalidateOn.includes(data.name)) {
        router.refresh()
      }
    }
  })

  return null
}
```

---

## Data Model

### Database Schema (contentResource)
```typescript
{
  id: string              // Primary key
  type: string            // 'post', 'lesson', etc.
  fields: {
    slug: string
    body: string | null   // Plain text fallback
    yDoc: string | null   // Base64-encoded Yjs state
    // ... other fields
  }
}
```

### Yjs Document Structure
```typescript
// Shared text type for CodeMirror
doc.getText('codemirror')
  .insert(0, 'Initial content')
  .toString() // => 'Initial content'

// Encoding for storage
const update = Y.encodeStateAsUpdate(doc)
const base64 = Buffer.from(update).toString('base64')

// Decoding from storage
const buffer = Buffer.from(base64, 'base64')
Y.applyUpdate(doc, new Uint8Array(buffer))
```

---

## Performance Characteristics

**Broadcast Rate:**
- 60 FPS (16.6ms interval)
- Defined: `BROADCAST_INTERVAL = 1000 / 60`
- Ensures smooth real-time updates

**Database Strategy:**
- **Load**: On connection (slug or ID lookup)
- **Save**: Autosave via callback (currently placeholder)
- **Fallback**: `yDoc` → `body` → empty doc

**Connection Scaling:**
- PartyKit handles connection pooling
- Each room (resource) = separate party instance
- Horizontal scaling via PartyKit infrastructure

---

## Error Handling

```mermaid
flowchart TD
    A[Load Document] --> B{yDoc exists?}

    B -->|Yes| C[Decode base64]
    C --> D{Apply successful?}

    D -->|Yes| E[Document Ready]
    D -->|No| F[Log Error]

    F --> G{body exists?}
    B -->|No| G

    G -->|Yes| H[Initialize from body]
    G -->|No| I[Return empty doc]

    H --> E
    I --> E

    E --> J[Client Connected]

    style F fill:#ff6b6b
    style I fill:#ffe66d
```

**Error Recovery:**
1. **yDoc decode failure**: Fall back to plain text `body`
2. **body missing**: Return empty Yjs document
3. **Database query failure**: Return empty doc (last resort)
4. **All errors logged**: Console output for debugging

---

## Security Considerations

**CORS Configuration:**
```typescript
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
}
```

**Current State:**
- ⚠️ Open CORS (`*`) - suitable for public content
- No authentication on WebSocket connections
- Room isolation by resource ID/slug

**Recommendations for Production:**
- Add authentication layer (JWT in WebSocket headers)
- Restrict CORS to known domains
- Implement rate limiting
- Add user presence tracking
- Implement document access control

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `party/index.ts` | PartyKit server implementation |
| `partykit.json` | PartyKit deployment config |
| `src/hooks/use-socket.ts` | Client WebSocket hook |
| `src/components/party.tsx` | Event listener component |
| `src/lib/posts.ts` | Post schema with yDoc field |

---

## Implementation Notes

1. **y-partykit Integration**: Uses `onConnect` from `y-partykit` package to handle Yjs document lifecycle automatically

2. **Snapshot Mode**: Configured with `persist: { mode: 'snapshot' }` for efficient storage

3. **Room Naming**: Rooms identified by either resource `slug` or `id` (flexible lookup)

4. **CodeMirror Text Type**: Yjs document uses shared text type named `'codemirror'` for editor integration

5. **No Explicit Save**: CRDT nature means document is always in valid state; autosave planned but not yet implemented

6. **Party Storage**: Server has access to `party.storage` for ephemeral state (currently used for messages array)

---

## Future Enhancements

- [ ] Implement autosave callback to persist yDoc to database
- [ ] Add user presence (cursors, selections)
- [ ] Implement undo/redo with Yjs history
- [ ] Add conflict visualization for debugging
- [ ] Implement authentication on WebSocket connections
- [ ] Add metrics/observability (connection count, edit rate)
- [ ] Implement document versioning/snapshots
- [ ] Add collaboration awareness (who's editing)
