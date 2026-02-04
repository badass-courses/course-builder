# Shortlinks Flow Documentation

## Overview

The ai-hero shortlinks system provides URL shortening with click tracking, analytics, and purchase attribution. Shortlinks enable marketing campaigns, social media sharing, and referral tracking with detailed insights into conversion rates.

### Key Components

- **URL Shortening**: Generate short `/s/{slug}` URLs that redirect to any destination
- **Click Tracking**: Record every click with metadata (referrer, device, country, user agent)
- **Redis Caching**: Fast lookups with database fallback
- **Purchase Attribution**: Link shortlinks to signups and purchases via cookies
- **Analytics Dashboard**: View clicks, referrers, devices, and attribution metrics
- **Admin UI**: Create, edit, delete shortlinks with real-time stats

---

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    SHORTLINK ||--o{ SHORTLINK_CLICK : has
    SHORTLINK ||--o{ SHORTLINK_ATTRIBUTION : tracks
    SHORTLINK }o--|| USER : created_by
    SHORTLINK_ATTRIBUTION }o--o| USER : attributed_to
    PURCHASE ||--o{ SHORTLINK_ATTRIBUTION : attributed_from

    SHORTLINK {
        string id PK
        string slug UK
        text url
        string description
        int clicks
        string createdById FK
        timestamp createdAt
        timestamp updatedAt
    }

    SHORTLINK_CLICK {
        string id PK
        string shortlinkId FK
        timestamp timestamp
        string referrer
        string userAgent
        string country
        string device
    }

    SHORTLINK_ATTRIBUTION {
        string id PK
        string shortlinkId FK
        string userId FK
        string email
        string type
        text metadata
        timestamp createdAt
    }

    USER {
        string id PK
        string email
        string name
        timestamp createdAt
    }

    PURCHASE {
        string id PK
        string userId FK
        string productId FK
        decimal totalAmount
        timestamp createdAt
    }
```

---

## 2. Shortlink Creation Flow

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant UI as Admin UI
    participant API as /api/shortlinks
    participant Query as shortlinks-query
    participant DB as Database
    participant Redis as Redis Cache

    Admin->>UI: Click "Create Shortlink"
    UI->>Admin: Show dialog with form
    Admin->>UI: Enter URL, optional slug/description
    UI->>API: POST /api/shortlinks<br/>{url, slug?, description?}

    Note over API: Validate auth (can('create', 'Content'))
    API->>API: CreateShortlinkSchema.parse()

    alt Slug provided
        API->>Query: isSlugAvailable(slug)
        Query->>DB: SELECT * FROM Shortlink WHERE slug=?
        DB-->>Query: null or existing
        Query-->>API: boolean

        alt Slug taken
            API-->>UI: 409 Conflict: "Slug already exists"
            UI-->>Admin: Show error toast
        end
    else No slug provided
        API->>Query: generateUniqueSlug()
        Query->>Query: nanoid() generates 6-char code
        loop Until unique (max 10 attempts)
            Query->>DB: Check availability
            DB-->>Query: Available or taken
        end
        Query-->>API: unique slug
    end

    API->>Query: createShortlink()
    Query->>DB: INSERT INTO Shortlink<br/>{slug, url, description, createdById}
    Note over DB: Unique constraint prevents race conditions
    DB-->>Query: insertedId

    Query->>DB: SELECT * FROM Shortlink WHERE id=insertedId
    DB-->>Query: shortlink record

    Query->>Redis: SET shortlink:{slug} {full record}
    Redis-->>Query: Cached

    Query->>Query: revalidateTag('shortlinks')
    Query-->>API: Created shortlink
    API-->>UI: 201 Created with shortlink data
    UI->>UI: Add new link to table
    UI-->>Admin: Show success toast with short URL
```

**Key Steps:**
1. Admin submits form with URL and optional custom slug
2. Validate authentication and input schema
3. Check slug availability or generate unique 6-character slug
4. Insert into database (unique constraint protects against race conditions)
5. Cache full shortlink record in Redis
6. Revalidate Next.js cache tag
7. Return created shortlink to UI

**Slug Generation:**
- Custom alphabet: `0-9A-Za-z` (62 characters)
- Length: 6 characters = 62^6 = ~56.8 billion combinations
- Collision handling: Max 10 retry attempts

---

## 3. Redirect & Click Tracking Flow

```mermaid
sequenceDiagram
    participant User as User/Visitor
    participant Route as /s/[slug]/route.ts
    participant Query as shortlinks-query
    participant Redis as Redis Cache
    participant DB as Database
    participant Logger as Logger

    User->>Route: GET /s/{slug}

    Note over Route: Extract request metadata
    Route->>Route: Parse headers:<br/>- referrer<br/>- user-agent<br/>- x-vercel-ip-country<br/>- device type

    Route->>Query: getShortlinkBySlug(slug)

    Note over Query: Try Redis first
    Query->>Redis: GET shortlink:{slug}

    alt Cache hit
        Redis-->>Query: Cached shortlink
        Query->>Logger: log('shortlink.cache.hit')
        Query-->>Route: shortlink
    else Cache miss
        Redis-->>Query: null
        Query->>DB: SELECT * FROM Shortlink WHERE slug=?
        DB-->>Query: shortlink or null

        alt Shortlink found
            Query->>Redis: SET shortlink:{slug} {record}
            Redis-->>Query: Cached
            Query->>Logger: log('shortlink.cache.miss', {cached: true})
        end

        Query-->>Route: shortlink or null
    end

    alt Shortlink not found
        Route-->>User: 404 Not Found
    end

    Note over Route: Record click asynchronously (don't await)
    Route->>Query: recordClick(slug, metadata)<br/>.catch(error => log.error(...))

    Note over Route: Set attribution cookie & redirect
    Route->>Route: Create NextResponse.redirect(url)
    Route->>Route: Set cookie 'sl_ref'={slug}<br/>maxAge=30 days, httpOnly=false
    Route-->>User: 302 Redirect + Set-Cookie header

    User->>User: Browser follows redirect to destination

    Note over Query: Background: Record click
    Query->>DB: SELECT * FROM Shortlink WHERE slug=?
    DB-->>Query: shortlink

    alt Shortlink exists
        Query->>DB: UPDATE Shortlink<br/>SET clicks = clicks + 1<br/>WHERE id=?
        DB-->>Query: Updated

        Query->>DB: INSERT INTO ShortlinkClick<br/>{shortlinkId, timestamp, referrer, userAgent, country, device}
        DB-->>Query: Inserted

        Query->>Logger: log('shortlink.click.recorded')
    else Shortlink not found
        Query->>Logger: log.warn('shortlink.click.notfound')
    end
```

**Key Steps:**
1. User visits `/s/{slug}` URL
2. Extract request metadata (referrer, user agent, country, device)
3. Lookup shortlink in Redis cache (fallback to DB)
4. Return 404 if shortlink doesn't exist
5. Trigger async click recording (don't block redirect)
6. Set `sl_ref` cookie with 30-day expiration
7. Redirect user to destination URL
8. **Background:** Increment click counter and insert click event

**Cookie Details:**
- Name: `sl_ref`
- Value: Shortlink slug
- Max Age: 30 days (2,592,000 seconds)
- HttpOnly: `false` (allows JS access for form submission)
- SameSite: `lax`
- Secure: Production only

**Device Detection:**
- Mobile: User-agent contains "mobile" or "android"
- Tablet: User-agent contains "tablet" or "ipad"
- Desktop: Default fallback

---

## 4. Purchase Attribution Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Checkout as Stripe Checkout
    participant Webhook as Stripe Webhook
    participant Inngest as Inngest
    participant Attribution as shortlink-attribution
    participant Query as shortlinks-query
    participant DB as Database
    participant Logger as Logger

    Note over User: Has sl_ref cookie from shortlink visit

    User->>Checkout: Complete purchase
    Note over Checkout: Cookie 'sl_ref' sent with request
    Note over Checkout: Checkout session metadata includes:<br/>shortlinkRef={slug}

    Webhook->>Inngest: checkout.session.completed event
    Inngest->>Inngest: Create Purchase record
    Inngest->>Inngest: Emit NEW_PURCHASE_CREATED_EVENT

    Attribution->>Attribution: Listen: NEW_PURCHASE_CREATED_EVENT
    Note over Attribution: Idempotency: purchaseId

    Attribution->>Attribution: Get purchase details

    alt No checkout session
        Attribution-->>Inngest: {skipped: true, reason: 'No checkout session'}
    end

    Attribution->>DB: getPurchase(purchaseId)
    DB-->>Attribution: purchase

    Attribution->>DB: getProduct(productId)
    DB-->>Attribution: product

    Attribution->>DB: getUserById(userId)
    DB-->>Attribution: user

    alt User not found
        Attribution-->>Inngest: {skipped: true, reason: 'User not found'}
    end

    Attribution->>Checkout: getCheckoutSession(checkoutSessionId)
    Checkout-->>Attribution: checkoutSession with metadata

    Note over Attribution: Extract metadata.shortlinkRef

    alt No shortlinkRef in metadata
        Attribution->>Logger: log.info('no_ref_in_metadata')
        Attribution-->>Inngest: {skipped: true, reason: 'No shortlink reference'}
    end

    Attribution->>Logger: log.info('found_ref', {shortlinkRef, purchaseId, productType})

    Attribution->>Query: createShortlinkAttribution({<br/>shortlinkSlug, email, userId, type: 'purchase', metadata<br/>})

    Query->>DB: SELECT * FROM Shortlink WHERE slug=?
    DB-->>Query: shortlink

    alt Shortlink not found
        Query->>Logger: log.warn('attribution.notfound')
        Query-->>Attribution: void
    end

    Note over Query: No deduplication for purchases<br/>(user can buy multiple products)

    Query->>DB: INSERT INTO ShortlinkAttribution<br/>{shortlinkId, userId, email, type, metadata}
    Note over DB: metadata includes:<br/>- productId<br/>- productName<br/>- purchaseId<br/>- totalAmount<br/>- productType
    DB-->>Query: Created

    Query->>Logger: log.info('attribution.recorded')
    Query-->>Attribution: void

    Attribution->>Logger: log.info('attribution.recorded', {purchaseId, productType})
    Attribution-->>Inngest: {recorded: true, shortlinkRef, userId}
```

**Key Steps:**
1. User completes purchase with `sl_ref` cookie present
2. Stripe checkout session includes `shortlinkRef` in metadata
3. Webhook processes purchase and emits `NEW_PURCHASE_CREATED_EVENT`
4. Attribution function triggered by Inngest event
5. Load purchase, product, and user details
6. Extract `shortlinkRef` from checkout session metadata
7. Create attribution record linking shortlink → purchase
8. Store rich metadata (product details, amount, purchase ID)

**Metadata Stored:**
```json
{
  "productId": "prod_abc123",
  "productName": "Advanced TypeScript Course",
  "purchaseId": "pur_xyz789",
  "totalAmount": "199.00",
  "productType": "self-paced"
}
```

**Deduplication:**
- **Signups**: One attribution per email per shortlink
- **Purchases**: No deduplication (user can buy multiple products)

---

## 5. Signup Attribution Flow

```mermaid
flowchart TD
    A[User clicks shortlink] --> B[Set sl_ref cookie]
    B --> C[User creates account]

    C --> D[Auth system creates user]
    D --> E{Check for sl_ref cookie}

    E -->|Cookie present| F[Pass shortlinkRef to system]
    E -->|No cookie| Z[Skip attribution]

    F --> G[createShortlinkAttribution called]
    G --> H[Lookup shortlink by slug]

    H --> I{Shortlink found?}
    I -->|No| Z
    I -->|Yes| J{Check existing attribution}

    J --> K[Query: shortlinkId + email + type='signup']
    K --> L{Already attributed?}

    L -->|Yes| M[Log: attribution.duplicate]
    L -->|No| N[Insert ShortlinkAttribution]

    M --> Z
    N --> O[Store: userId, email, type='signup']
    O --> P[Log: attribution.recorded]
    P --> Z[End]

    style N fill:#90EE90
    style Z fill:#FFD700
```

**Key Points:**
- Attribution cookie checked during signup flow
- One signup attribution per email per shortlink (deduplicated)
- No metadata stored for signups (unlike purchases)
- Failed lookups logged but don't block signup

---

## 6. Analytics Dashboard

### Available Metrics

```mermaid
flowchart LR
    subgraph "Overview Stats"
        A[Total Clicks<br/>from Shortlink.clicks]
        B[Last 60 Minutes<br/>time-based filter]
        C[Last 24 Hours<br/>time-based filter]
    end

    subgraph "Click Analytics"
        D[Clicks by Day<br/>30-day chart]
        E[Top Referrers<br/>grouped by referrer]
        F[Device Breakdown<br/>mobile/tablet/desktop]
        G[Recent Clicks<br/>last 50 events]
    end

    subgraph "Attribution Analytics"
        H[Signups Count<br/>type='signup']
        I[Purchases Count<br/>type='purchase']
        J[Conversion Rate<br/>purchases/clicks]
    end

    A --> D
    D --> E
    E --> F
    F --> G

    H --> I
    I --> J
```

### Analytics Queries

**Clicks by Day (Last 30 Days):**
```sql
SELECT
  DATE(timestamp) as date,
  COUNT(*) as clicks
FROM ShortlinkClick
WHERE shortlinkId = ?
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(timestamp)
ORDER BY date
```

**Top Referrers:**
```sql
SELECT
  COALESCE(referrer, 'Direct') as referrer,
  COUNT(*) as clicks
FROM ShortlinkClick
WHERE shortlinkId = ?
GROUP BY referrer
ORDER BY clicks DESC
LIMIT 10
```

**Device Breakdown:**
```sql
SELECT
  COALESCE(device, 'Unknown') as device,
  COUNT(*) as clicks
FROM ShortlinkClick
WHERE shortlinkId = ?
GROUP BY device
ORDER BY clicks DESC
```

**Recent Clicks:**
```sql
SELECT *
FROM ShortlinkClick
WHERE shortlinkId = ?
ORDER BY timestamp DESC
LIMIT 50
```

---

## 7. Admin Interface Structure

```mermaid
flowchart TD
    subgraph "Main List View"
        A[/admin/shortlinks]
        A1[Recent Stats Cards<br/>Last 60min, Last 24hrs]
        A2[Search Bar<br/>Filter by slug/url/description]
        A3[Create Button<br/>Opens CRUD dialog]
        A4[Shortlinks Table<br/>Desktop view]
        A5[Shortlinks Cards<br/>Mobile view]

        A --> A1
        A --> A2
        A --> A3
        A --> A4
        A --> A5
    end

    subgraph "Table Columns"
        B1[Short URL<br/>Copy button]
        B2[Destination<br/>Truncated with tooltip]
        B3[Clicks<br/>Total count]
        B4[Signups<br/>Attribution count]
        B5[Purchases<br/>Attribution count]
        B6[Created<br/>Date]
        B7[Actions<br/>Analytics/Edit/Delete]

        A4 --> B1
        A4 --> B2
        A4 --> B3
        A4 --> B4
        A4 --> B5
        A4 --> B6
        A4 --> B7
    end

    subgraph "CRUD Dialog"
        C1[Create Mode<br/>Empty form]
        C2[Edit Mode<br/>Pre-filled form]
        C3[Fields:<br/>URL, Slug, Description]
        C4[Generate Button<br/>Auto-generate slug]
        C5[Save Action<br/>POST or PATCH]
    end

    subgraph "Analytics View"
        D[/admin/shortlinks/[id]/analytics]
        D1[Back Button<br/>Return to list]
        D2[Shortlink Header<br/>Slug + destination]
        D3[Total Clicks Card]
        D4[Clicks Chart<br/>30-day line chart]
        D5[Top Referrers Table]
        D6[Device Breakdown<br/>Pie chart]
        D7[Recent Clicks Table<br/>Last 50 events]
    end

    A3 --> C1
    B7 --> C2
    B7 --> D

    D --> D1
    D --> D2
    D --> D3
    D --> D4
    D --> D5
    D --> D6
    D --> D7
```

### Page Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/admin/shortlinks` | List all shortlinks with stats | Admin (`manage`, `all`) |
| `/admin/shortlinks/[id]/analytics` | Detailed analytics for one link | Admin (`manage`, `all`) |
| `/api/shortlinks` | CRUD API endpoint | Admin (create/update/delete `Content`) |
| `/s/[slug]` | Public redirect route | Public (no auth) |

### UI Components

**ShortlinksManagement** (`shortlinks-client-page.tsx`)
- Server-side data loading with `getShortlinksWithAttributions()`
- Client-side search with 250ms debounce
- Real-time stats cards (60min, 24hr)
- Responsive table (desktop) and cards (mobile)
- Delete confirmation dialog

**ShortlinkCrudDialog** (`shortlink-crud-dialog.tsx`)
- Create/edit modal form
- Slug validation regex: `^[a-zA-Z0-9_-]+$`
- URL validation with Zod schema
- Optional description (max 255 chars)
- Generate unique slug button

**ShortlinkAnalyticsView** (`analytics-client-page.tsx`)
- Total clicks metric card
- Clicks by day chart (30 days)
- Top 10 referrers table
- Device breakdown chart
- Recent 50 clicks table with metadata

---

## 8. API Endpoints

### GET /api/shortlinks

**Purpose:** List all shortlinks or get single by ID

**Auth:** Admin (`manage`, `all`)

**Query Params:**
- `id` (optional): Get single shortlink by ID
- `search` (optional): Filter by slug/url/description

**Response:**
```json
// Single shortlink
{
  "id": "slnk_123",
  "slug": "abc123",
  "url": "https://aihero.dev/courses/typescript",
  "description": "TypeScript Course Link",
  "clicks": 1247,
  "createdById": "user_789",
  "createdAt": "2026-01-15T10:30:00Z",
  "updatedAt": "2026-02-01T14:22:00Z"
}

// List with attributions
[
  {
    ...shortlink,
    "signups": 23,
    "purchases": 8
  }
]
```

### POST /api/shortlinks

**Purpose:** Create new shortlink

**Auth:** Content Creator (`create`, `Content`)

**Body:**
```json
{
  "url": "https://aihero.dev/courses/typescript",
  "slug": "ts-course",  // optional
  "description": "TypeScript Course"  // optional
}
```

**Response:** `201 Created` with shortlink object

**Errors:**
- `400`: Invalid input (schema validation)
- `409`: Slug already exists
- `401`: Unauthorized
- `403`: Forbidden

### PATCH /api/shortlinks

**Purpose:** Update existing shortlink

**Auth:** Content Creator (`update`, `Content`)

**Body:**
```json
{
  "id": "slnk_123",
  "url": "https://aihero.dev/courses/advanced-typescript",  // optional
  "slug": "adv-ts",  // optional
  "description": "Advanced TypeScript"  // optional
}
```

**Response:** `200 OK` with updated shortlink

**Errors:**
- `400`: Invalid input
- `404`: Shortlink not found
- `409`: New slug already exists

### DELETE /api/shortlinks

**Purpose:** Delete shortlink and all associated data

**Auth:** Content Creator (`delete`, `Content`)

**Query Params:**
- `id`: Shortlink ID to delete

**Response:** `200 OK`

**Cascade Behavior:**
- Deletes all `ShortlinkClick` records
- Deletes all `ShortlinkAttribution` records
- Removes from Redis cache
- Manual cascade (PlanetScale doesn't support FK constraints)

---

## 9. Integration with Commerce

### Checkout Flow Integration

```mermaid
sequenceDiagram
    participant User as User
    participant Page as Product Page
    participant Checkout as Stripe Checkout
    participant Cookie as Browser Cookie
    participant Stripe as Stripe Session

    Note over User: Arrives via /s/promo123
    User->>Cookie: sl_ref=promo123 (30 days)

    User->>Page: Click "Buy Now"
    Page->>Cookie: Read sl_ref cookie
    Cookie-->>Page: "promo123"

    Page->>Checkout: createCheckoutSession({<br/>priceId, metadata: {shortlinkRef: 'promo123'}<br/>})
    Checkout->>Stripe: Create session with metadata
    Stripe-->>Checkout: Session URL

    Checkout-->>User: Redirect to Stripe

    User->>Stripe: Complete payment
    Stripe->>Stripe: Webhook with metadata.shortlinkRef
```

**Key Integration Points:**

1. **Cookie Persistence:** 30-day cookie ensures attribution even if user returns later
2. **Metadata Passthrough:** `shortlinkRef` stored in Stripe session metadata
3. **Webhook Processing:** Attribution triggered by purchase creation event
4. **No Server-Side Session:** Uses HTTP-only cookie for attribution (no session storage)

### Conversion Funnel

```
Shortlink Click → Cookie Set → Browse Site → Checkout → Purchase → Attribution
     ↓              ↓             ↓            ↓           ↓            ↓
  recordClick   sl_ref=slug   (browse)    metadata    purchase    linkAttribution
```

**Conversion Metrics:**
- **Click-to-Purchase Rate**: `purchases / clicks`
- **Click-to-Signup Rate**: `signups / clicks`
- **Purchase-per-Signup**: `purchases / signups`

---

## 10. Redis Caching Strategy

### Cache Key Format

```
shortlink:{slug} → Full Shortlink object
```

### Cache Lifecycle

**Set Cache:**
- On create: `createShortlink()`
- On update: `updateShortlink()`
- On cache miss: `getShortlinkBySlug()`

**Delete Cache:**
- On update (if slug changed): Delete old key
- On delete: `deleteShortlink()`

**Cache Hit Flow:**
```mermaid
flowchart LR
    A[Request /s/abc123] --> B{Redis cache?}
    B -->|Hit| C[Return cached record]
    B -->|Miss| D[Query database]
    D --> E[Cache result]
    E --> F[Return record]
    C --> G[Redirect user]
    F --> G
```

**Benefits:**
- **Fast redirects**: Redis lookup ~1ms vs DB ~10-50ms
- **Reduced DB load**: Popular links hit cache
- **Consistent data**: Cache updated on create/update/delete

---

## 11. Security & Validation

### Slug Validation

**Regex:** `^[a-zA-Z0-9_-]+$`

**Restrictions:**
- Alphanumeric characters only
- Hyphens and underscores allowed
- No spaces or special characters
- Min length: 1 character
- Max length: 50 characters

**Purpose:** URL-safe, readable, no XSS risk

### URL Validation

**Schema:** `z.string().url()`

**Checks:**
- Valid protocol (http/https)
- Valid domain format
- No SQL injection risk
- Stored as plain text in database

### Authorization Levels

| Action | Permission Required | CASL Check |
|--------|---------------------|------------|
| View list | Admin | `can('manage', 'all')` |
| Create | Content creator | `can('create', 'Content')` |
| Update | Content creator | `can('update', 'Content')` |
| Delete | Content creator | `can('delete', 'Content')` |
| Analytics | Admin | `can('manage', 'all')` |
| Redirect | Public | None (no auth) |

### Race Condition Protection

**Database Unique Constraint:**
```sql
CREATE UNIQUE INDEX slug_idx ON Shortlink(slug)
```

**Behavior:**
- Availability check is advisory only
- Database constraint provides final protection
- Duplicate insert returns error
- Client retries with new slug

---

## 12. Performance Characteristics

### Redirect Performance

**Typical Flow:**
1. DNS lookup: ~20ms
2. TLS handshake: ~50ms
3. Redis lookup: ~1ms (cache hit)
4. HTTP redirect: ~5ms
5. **Total:** ~76ms + destination load

**Cache Miss:**
1-3. Same as above: ~70ms
4. Database query: ~10-50ms
5. Cache write: ~1ms
6. HTTP redirect: ~5ms
7. **Total:** ~86-126ms + destination load

### Click Recording

**Async Processing:**
- Redirect happens immediately
- Click recording runs in background
- Failed recordings logged but don't block user

**Database Operations:**
1. `UPDATE Shortlink SET clicks = clicks + 1` (~5ms)
2. `INSERT INTO ShortlinkClick` (~10ms)
3. **Total:** ~15ms (async)

### Analytics Queries

| Query | Typical Time | Optimization |
|-------|-------------|--------------|
| List with attributions | ~50-100ms | LEFT JOIN + GROUP BY |
| Clicks by day | ~20-50ms | Index on (shortlinkId, timestamp) |
| Top referrers | ~20-40ms | Index on (shortlinkId, referrer) |
| Device breakdown | ~15-30ms | Index on (shortlinkId, device) |
| Recent clicks | ~10-20ms | Index on (shortlinkId, timestamp DESC) |

**Recommended Indexes:**
```sql
CREATE INDEX idx_click_shortlink_timestamp ON ShortlinkClick(shortlinkId, timestamp DESC);
CREATE INDEX idx_click_shortlink_referrer ON ShortlinkClick(shortlinkId, referrer);
CREATE INDEX idx_click_shortlink_device ON ShortlinkClick(shortlinkId, device);
CREATE INDEX idx_attribution_shortlink ON ShortlinkAttribution(shortlinkId, type);
CREATE INDEX idx_attribution_email ON ShortlinkAttribution(shortlinkId, email, type);
```

---

## 13. Error Handling

### Common Error Scenarios

**Shortlink Not Found (404):**
- User visits `/s/invalid-slug`
- Response: "Shortlink not found"
- No click recorded
- Logged: `log.warn('shortlink.lookup.not_found')`

**Slug Already Exists (409):**
- Admin creates shortlink with taken slug
- Response: "Slug already exists"
- UI shows error toast
- User can retry with different slug

**Rate Limit Protection:**
- Not currently implemented
- Consider adding per-IP rate limits
- Cloudflare/Vercel edge protection recommended

**Database Failures:**
- Redis cache miss handled gracefully
- Database timeout: Return 500 error
- Click recording failure: Logged, doesn't block redirect

### Logging Strategy

**Info Logs:**
- `shortlink.created`: New shortlink created
- `shortlink.cache.hit`: Redis cache hit
- `shortlink.cache.miss`: Redis cache miss (with cache write)
- `shortlink.click.recorded`: Click successfully tracked
- `shortlink.attribution.recorded`: Attribution created

**Warning Logs:**
- `shortlink.lookup.not_found`: Invalid slug accessed
- `shortlink.attribution.notfound`: Attribution for missing shortlink
- `shortlink.attribution.duplicate`: Duplicate signup attribution

**Error Logs:**
- `shortlink.click.error`: Failed to record click
- `shortlink.attribution.error`: Failed to create attribution
- `shortlink.redirect.failed`: Redirect handler error

---

## Summary

The shortlinks system provides:

**Core Features:**
- Short URL generation with custom or auto-generated slugs
- Fast redirects with Redis caching and database fallback
- Comprehensive click tracking with metadata (referrer, device, country)
- Purchase and signup attribution via cookies and Stripe metadata
- Real-time analytics dashboard with charts and tables

**Architecture Highlights:**
- Event-driven attribution via Inngest
- Async click recording (doesn't block redirects)
- Race condition protection via database constraints
- Manual cascade deletes (PlanetScale compatibility)
- Redis caching for performance

**Integration Points:**
- Stripe checkout session metadata
- Commerce purchase workflow (Inngest events)
- Authentication system (signup attribution)
- Analytics queries (aggregated metrics)

**Performance:**
- ~76ms redirect time (Redis cache hit)
- ~15ms async click recording
- ~50-100ms analytics queries with proper indexes

**Use Cases:**
- Marketing campaign tracking
- Social media link sharing
- Referral program attribution
- A/B testing different landing pages
- Conversion funnel analysis

---

**Last Updated:** 2026-02-04
**Maintained By:** AI Hero Development Team
