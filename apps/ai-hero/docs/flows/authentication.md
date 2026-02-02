# Authentication Flow Documentation

## Overview

AI Hero uses NextAuth.js v5 for authentication with multiple providers:
- **OAuth**: GitHub, Discord, Twitter
- **Magic Link**: Email-based passwordless authentication via Postmark
- **Authorization**: CASL-based ability rules for fine-grained permissions
- **User Management**: Inngest events for async user creation workflow
- **Organizations**: Multi-tenant support with organization memberships and roles

Key components:
- **NextAuth config**: `/src/server/auth.ts`
- **CASL abilities**: `/src/ability/index.ts`
- **Email provider**: `/src/coursebuilder/email-provider.ts`
- **User creation**: `/src/inngest/functions/user-created.ts`
- **Database**: Drizzle ORM with MySQL (users, accounts, sessions, organizationMemberships)

---

## 1. OAuth Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant NA as NextAuth
    participant OP as OAuth Provider<br/>(GitHub/Discord/Twitter)
    participant DB as Database
    participant IN as Inngest
    participant AM as Amplitude

    U->>B: Click "Sign in with GitHub/Discord/Twitter"
    B->>NA: GET /api/auth/signin/{provider}
    NA->>OP: Redirect to OAuth authorize URL
    OP->>U: Show authorization page
    U->>OP: Approve access
    OP->>NA: Redirect with authorization code
    NA->>OP: Exchange code for access token
    OP->>NA: Return access_token, refresh_token, profile
    NA->>DB: Check if user exists by email

    alt User doesn't exist
        NA->>DB: Create user record
        NA->>DB: Create account link
        NA->>IN: Emit USER_CREATED_EVENT
        IN->>DB: Assign "user" role
        IN->>DB: Create newsletter preference
        NA->>AM: Track "user-created"
    else User exists
        NA->>DB: Link new account to existing user
        NA->>IN: Emit OAUTH_PROVIDER_ACCOUNT_LINKED_EVENT
        NA->>AM: Track "account-linked"
    end

    NA->>DB: Create session
    NA->>B: Set session cookie
    B->>U: Redirect to app (logged in)
```

### OAuth Provider Configuration

```mermaid
graph LR
    A[Auth Config] --> B[GitHub Provider]
    A --> C[Discord Provider]
    A --> D[Twitter Provider]

    B --> E[CLIENT_ID env]
    B --> F[CLIENT_SECRET env]
    B --> G[allowDangerousEmailAccountLinking]

    C --> H[CLIENT_ID env]
    C --> I[CLIENT_SECRET env]
    C --> J[allowDangerousEmailAccountLinking]
    C --> K[Extended scopes:<br/>identify, email, guilds.join, guilds]

    D --> L[API_KEY env]
    D --> M[API_SECRET env]
    D --> N[allowDangerousEmailAccountLinking]
```

### Discord Token Refresh Flow

```mermaid
sequenceDiagram
    participant S as Session Callback
    participant DB as Database
    participant D as Discord API

    S->>DB: Load user with accounts
    S->>S: Check if Discord token expired

    alt Token expired
        S->>D: POST /api/oauth2/token<br/>(grant_type: refresh_token)
        D->>S: Return new access_token, refresh_token, expires_in
        S->>DB: Update account tokens
        S->>S: Return refreshed session
    else Token valid
        S->>S: Return session
    end
```

---

## 2. Email Magic Link Flow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant NA as NextAuth
    participant AD as Adapter
    participant DB as Database
    participant PM as Postmark
    participant IN as Inngest
    participant EM as Email Client

    U->>B: Enter email on /login
    B->>NA: POST /api/auth/signin/email
    NA->>AD: Call sendVerificationRequest
    AD->>DB: findOrCreateUser(email)

    alt User doesn't exist
        DB->>AD: Create user
        AD->>NA: User created
    else User exists
        DB->>AD: Return existing user
    end

    AD->>AD: Generate magic link token
    AD->>DB: Store verification token
    AD->>PM: Send email via Postmark API
    PM->>EM: Deliver magic link email
    AD->>B: Redirect to /check-your-email

    U->>EM: Open email
    U->>EM: Click magic link
    EM->>NA: GET /api/auth/callback/email?token=...
    NA->>DB: Verify token

    alt Token valid
        NA->>DB: Delete verification token
        NA->>DB: Create session

        alt New user (first login)
            NA->>IN: Emit USER_CREATED_EVENT
            IN->>DB: Assign "user" role
            IN->>DB: Create newsletter preference
        end

        NA->>B: Set session cookie
        B->>U: Redirect to app (logged in)
    else Token invalid/expired
        NA->>B: Redirect to /error?error=Verification
        B->>U: Show error message
    end
```

### Email Types

```mermaid
graph TD
    A[Magic Link Email Type] --> B[login]
    A --> C[signup]
    A --> D[purchase]
    A --> E[transfer]
    A --> F[reset]
    A --> G[upgrade]

    B --> H["Subject: Log in to ${SITE_TITLE}"]
    C --> I["Subject: Welcome to ${SITE_TITLE}"]
    D --> J["Subject: Thank you for Purchasing"]
    E --> K["Subject: Accept Your Seat"]

    B --> L[PostPurchaseLoginEmail template]
    C --> M[NewMemberEmail template]
    D --> L
    E --> L
```

---

## 3. Database Schema (Auth Tables)

```mermaid
erDiagram
    USERS ||--o{ ACCOUNTS : has
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ ORGANIZATION_MEMBERSHIPS : has
    USERS ||--o{ ENTITLEMENTS : "has (via membership)"

    ROLES ||--o{ USER_ROLES : assigned_to
    ORGANIZATION_MEMBERSHIPS ||--o{ ORG_MEMBERSHIP_ROLES : has
    ORGANIZATION_MEMBERSHIPS ||--o{ ENTITLEMENTS : grants
    ROLES ||--o{ ORG_MEMBERSHIP_ROLES : assigned_to
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERSHIPS : has

    USERS {
        string id PK
        string email
        string name
        string image
        datetime emailVerified
        string role "admin|user|contributor"
    }

    ACCOUNTS {
        string userId FK
        string provider "github|discord|twitter|email"
        string providerAccountId
        string access_token
        string refresh_token
        int expires_at
        string token_type
        string scope
    }

    SESSIONS {
        string sessionToken PK
        string userId FK
        datetime expires
    }

    ROLES {
        string id PK
        string name "admin|user|contributor|reviewer"
        string description
    }

    USER_ROLES {
        string userId FK
        string roleId FK
    }

    ORGANIZATIONS {
        string id PK
        string name
        string slug
    }

    ORGANIZATION_MEMBERSHIPS {
        string id PK
        string userId FK
        string organizationId FK
        datetime createdAt
    }

    ORG_MEMBERSHIP_ROLES {
        string membershipId FK
        string roleId FK
    }

    ENTITLEMENTS {
        string id PK
        string organizationMembershipId FK
        string entitlementType "cohort_content_access|workshop_content_access"
        datetime expiresAt
        json metadata "contentIds, startDate, etc"
    }
```

---

## 4. CASL Authorization Rules

```mermaid
flowchart TD
    Start[Get Ability for User] --> CheckUser{User exists?}

    CheckUser -->|No| AnonymousRules[Anonymous Rules:<br/>- Read public content<br/>- No write access]
    CheckUser -->|Yes| CheckAdmin{Has admin role?}

    CheckAdmin -->|Yes| AdminRules[Admin Rules:<br/>- can manage all<br/>- Full access]
    CheckAdmin -->|No| CheckContributor{Has contributor role?}

    CheckContributor -->|Yes| ContribRules[Contributor Rules:<br/>- can create Content<br/>- can manage own Content<br/>- can publish own Content]
    CheckContributor -->|No| CheckReviewer{Has reviewer role?}

    CheckReviewer -->|Yes| ReviewRules[Reviewer Rules:<br/>- can read all Content]
    CheckReviewer -->|No| UserRules[Base User Rules:<br/>- can read/update own User]

    UserRules --> CheckOrgRole{Has org roles?}
    ContribRules --> CheckOrgRole
    ReviewRules --> CheckOrgRole

    CheckOrgRole -->|Yes| IterateOrgs[For each org role]
    IterateOrgs --> CheckOrgOwner{Is owner?}

    CheckOrgOwner -->|Yes| OwnerRules[Owner Rules:<br/>- can manage Organization<br/>- can manage Members<br/>- can manage Billing<br/>- can transfer Organization]
    CheckOrgOwner -->|No| CheckOrgAdmin{Is admin?}

    CheckOrgAdmin -->|Yes| OrgAdminRules[Admin Rules:<br/>- can create/read/update Org<br/>- can CRUD Members<br/>- can read/update Billing]
    CheckOrgAdmin -->|No| CheckOrgMember{Is member/learner?}

    CheckOrgMember -->|Yes| MemberRules[Member Rules:<br/>- can read Organization<br/>- can read Members<br/>- can delete self from Org]

    OwnerRules --> CheckEntitlements{Has entitlements?}
    OrgAdminRules --> CheckEntitlements
    MemberRules --> CheckEntitlements
    CheckOrgRole -->|No| CheckEntitlements

    CheckEntitlements -->|Yes| EntitlementRules[Content Access Rules:<br/>- cohort_content_access<br/>- workshop_content_access<br/>- Check metadata.contentIds]
    CheckEntitlements -->|No| EndRules[Return Ability]

    EntitlementRules --> EndRules
    AnonymousRules --> EndRules
    AdminRules --> EndRules
```

### Purchase-Based Access Rules

```mermaid
flowchart TD
    Start[defineRulesForPurchases] --> CheckPurchases{Has purchases?}

    CheckPurchases -->|No| CheckFree{Content freely visible?}
    CheckPurchases -->|Yes| ValidatePurchase[For each purchase]

    ValidatePurchase --> CheckBulk{Is bulk purchase?}
    CheckBulk -->|Yes| DenyBulk[Deny: bulk_purchase]
    CheckBulk -->|No| CheckRegion{Status = Restricted?}

    CheckRegion -->|Yes| CheckCountry{Country matches?}
    CheckCountry -->|No| DenyRegion[Deny: region_restricted<br/>can read RegionRestriction]
    CheckCountry -->|Yes| GrantAccess[Grant: can read Content]

    CheckRegion -->|No| CheckValid{Status = Valid?}
    CheckValid -->|Yes| GrantAccess
    CheckValid -->|No| DenyUnknown[Deny: unknown]

    GrantAccess --> CheckCharges{Has charges?}
    CheckCharges -->|Yes| GrantInvoice[can read Invoice]

    CheckCharges --> CheckBulkPurchase{Has bulk purchase?}
    CheckBulkPurchase -->|Yes| GrantTeam[can read Team]

    CheckBulkPurchase --> CheckSeats{Has available seats?}
    CheckSeats -->|Yes| GrantInvite[can invite Team]

    CheckFree -->|Yes| GrantPublic[can read Content]
    CheckFree -->|No| CheckEntitlements{Has entitlements?}

    CheckEntitlements -->|Yes| IterateEntitlements[For each entitlement]
    IterateEntitlements --> CheckCohort{Type = cohort_content_access?}

    CheckCohort -->|Yes| CheckStartDate{Module started?}
    CheckStartDate -->|Yes| GrantCohortLessons[can read Content<br/>module + lessons]
    CheckStartDate -->|No| PendingAccess[can read PendingOpenAccess]

    CheckCohort -->|No| CheckWorkshop{Type = workshop_content_access?}
    CheckWorkshop -->|Yes| GrantWorkshopAccess[can read Content<br/>workshop + lessons]

    CheckEntitlements -->|No| CheckFreeTier{Has free tier resources?}
    CheckFreeTier -->|Yes| GrantFreeTier[can read Content<br/>free lessons/sections]

    CheckFreeTier -->|No| End[Return Rules]
    GrantPublic --> End
    GrantCohortLessons --> End
    PendingAccess --> End
    GrantWorkshopAccess --> End
    GrantFreeTier --> End
    GrantInvite --> End
    GrantTeam --> End
    GrantInvoice --> End
```

---

## 5. Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Anonymous: Page Load

    Anonymous --> Authenticating: Click Sign In
    Authenticating --> ValidatingToken: OAuth/Magic Link Callback

    ValidatingToken --> CreatingSession: Token Valid
    ValidatingToken --> Error: Token Invalid/Expired
    Error --> Anonymous: Redirect to /error

    CreatingSession --> LoadingUser: Session Created
    LoadingUser --> EnrichingSession: User Loaded

    EnrichingSession --> LoadingRoles: Query user roles
    LoadingRoles --> LoadingOrgData: Query org memberships
    LoadingOrgData --> LoadingEntitlements: Check x-organization-id header
    LoadingEntitlements --> CheckingDiscord: Load active entitlements

    CheckingDiscord --> RefreshingToken: Discord token expired
    RefreshingToken --> Authenticated: Token refreshed
    CheckingDiscord --> Authenticated: Token valid

    Authenticated --> Authenticated: Subsequent Requests<br/>(Session middleware)
    Authenticated --> LoadingUser: Session Refresh<br/>(JWT rotation)
    Authenticated --> SigningOut: Click Sign Out

    SigningOut --> DeletingCookie: Delete organizationId cookie
    DeletingCookie --> DeletingSession: Remove session
    DeletingSession --> Anonymous: Redirect to /

    note right of EnrichingSession
        Session includes:
        - user.id
        - user.role (admin|user|contributor)
        - user.roles[] (from userRoles)
        - user.organizationRoles[]
        - user.entitlements[]
    end note

    note right of LoadingEntitlements
        Entitlements filtered by:
        - organizationMembershipId
        - expiresAt > now OR null
        - deletedAt IS NULL
    end note
```

---

## 6. User Creation Workflow (Inngest)

```mermaid
sequenceDiagram
    participant NA as NextAuth Event
    participant IN as Inngest
    participant DB as Database
    participant AMP as Amplitude

    NA->>IN: USER_CREATED_EVENT<br/>{user: {id, email, name}}

    IN->>AMP: Track "user-created"<br/>(identify + track event)

    IN->>DB: Query CommunicationPreferenceTypes<br/>(name = "Newsletter")
    IN->>DB: Query CommunicationChannel<br/>(name = "Email")

    alt Preference type/channel missing
        IN->>IN: Throw NonRetriableError
    end

    IN->>DB: Query roles<br/>(name = "user")

    alt User role missing
        IN->>IN: Throw Error
    end

    IN->>DB: INSERT INTO userRoles<br/>(userId, roleId)
    IN->>DB: INSERT INTO communicationPreferences<br/>(userId, preferenceTypeId, channelId, active: true)

    Note over IN: Email sending currently disabled<br/>(commented out in code)

    IN->>IN: Parse email body with Liquid template
    IN->>IN: Parse email subject with Liquid template

    Note over IN: Would send welcome email via Postmark<br/>using BasicEmail template

    IN->>NA: Return {sendResponse, email, user}
```

---

## 7. Organization Membership & Roles

```mermaid
graph TD
    User[User] --> Membership1[Organization Membership 1]
    User --> Membership2[Organization Membership 2]

    Membership1 --> Org1[Organization A]
    Membership2 --> Org2[Organization B]

    Membership1 --> Role1A[Owner Role]
    Membership1 --> Role1B[Admin Role]
    Membership2 --> Role2A[Member Role]

    Membership1 --> Ent1[Entitlement 1:<br/>cohort_content_access]
    Membership1 --> Ent2[Entitlement 2:<br/>workshop_content_access]

    Ent1 --> Content1[Workshop 101]
    Ent1 --> Content2[Workshop 102]
    Ent2 --> Content3[Self-Paced Course]

    Membership2 --> Ent3[Entitlement 3:<br/>cohort_content_access]
    Ent3 --> Content4[Cohort Winter 2024]

    style Ent1 fill:#e1f5ff
    style Ent2 fill:#e1f5ff
    style Ent3 fill:#e1f5ff

    Note1[Organization-scoped permissions:<br/>- x-organization-id header<br/>- Session includes organizationRoles[]]
    Note2[Entitlement metadata:<br/>- contentIds: string[]<br/>- startsAt: datetime<br/>- expiresAt: datetime]
```

### Organization Permission Matrix

```mermaid
graph LR
    A[Role] --> B[owner]
    A --> C[admin]
    A --> D[member/learner]

    B --> E["manage Organization<br/>manage Members<br/>manage Billing<br/>transfer Organization"]

    C --> F["create/read/update Org<br/>CRUD Members<br/>read/update Billing"]

    D --> G["read Organization<br/>read Members<br/>delete self"]

    style B fill:#ff6b6b
    style C fill:#ffd93d
    style D fill:#6bcf7f
```

---

## 8. Authorization Check Flow

```mermaid
sequenceDiagram
    participant C as Component/API
    participant GA as getServerAuthSession
    participant AUTH as NextAuth
    participant DB as Database
    participant CASL as getAbility
    participant AB as Ability Instance

    C->>GA: Call getServerAuthSession()
    GA->>AUTH: auth()
    AUTH->>DB: Load session + user
    DB->>AUTH: Return session data

    AUTH->>GA: session {user: {id, email, ...}}
    GA->>GA: Parse user with userSchema
    GA->>CASL: getAbility({user})

    CASL->>CASL: Call getAbilityRules(user)

    alt User has admin role
        CASL->>AB: can('manage', 'all')
    end

    alt User has contributor role
        CASL->>AB: can('create', 'Content')
        CASL->>AB: can('manage', 'Content', {createdById: user.id})
    end

    alt User has reviewer role
        CASL->>AB: can('read', 'Content')
    end

    CASL->>AB: can(['read', 'update'], 'User', {id: user.id})

    alt User has organization roles
        loop For each org role
            CASL->>AB: Organization-scoped rules
        end
    end

    AB->>CASL: Return compiled ability
    CASL->>GA: Return ability
    GA->>C: {session, ability}

    C->>AB: ability.can('read', 'Content')
    AB->>C: true/false
```

---

## Key Features & Patterns

### 1. **Dangerous Email Account Linking**
All OAuth providers have `allowDangerousEmailAccountLinking: true`, meaning if a user signs in with GitHub and then Discord using the same email, both accounts link to the same user record.

### 2. **Token Refresh**
Discord OAuth tokens are automatically refreshed when expired (checked in session callback). Access token, refresh token, and expiry are updated in the database.

### 3. **Magic Link Types**
Email provider supports multiple magic link types: login, signup, purchase, transfer, reset, upgrade. Each type has a different subject line and can use different email templates.

### 4. **Organization Context**
Authorization checks use the `x-organization-id` header to scope permissions. The session callback loads organization memberships and roles based on this header.

### 5. **Entitlements**
Content access is granted via entitlements linked to organization memberships. Two types:
- `cohort_content_access`: Time-based access with start dates
- `workshop_content_access`: Immediate access to workshop + lessons

### 6. **Role Hierarchy**
- **admin**: Full access to everything
- **contributor**: Can create and manage own content
- **reviewer**: Can read all content
- **user**: Base permissions (read/update self)
- **Organization roles**: owner > admin > member/learner

### 7. **CASL Conditions**
CASL rules use MongoDB query syntax for conditions:
- `{id: {$eq: userId}}` - Exact match
- `{id: {$in: [id1, id2]}}` - Array membership
- `{createdById: {$eq: userId}}` - Ownership check

### 8. **Free Tier Access**
Resources can be marked as `tier: 'free'` in metadata. These are accessible to all users without purchase or entitlement, including:
- Free sections (all lessons in section)
- Individual free lessons/exercises/posts

---

## Environment Variables

```bash
# OAuth Providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=

# Email (Magic Link)
POSTMARK_API_KEY=
NEXT_PUBLIC_SUPPORT_EMAIL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Analytics
NEXT_PUBLIC_AMPLITUDE_API_KEY=

# Feature Flags
CREATE_USER_ON_LOGIN=true
LOG_VERIFICATION_URL=false
SKIP_EMAIL=false
```

---

## Error Handling

1. **Invalid Magic Link**: Redirect to `/error?error=Verification`
2. **Missing OAuth Credentials**: Provider not added to config (conditional)
3. **Token Refresh Failure**: Return `{error: 'Failed to refresh session'}`
4. **Missing Postmark Key**: Throw error, email sending fails
5. **User Creation Failure**: Inngest NonRetriableError for missing preferences

---

## Testing Considerations

- **Test OAuth flow**: Mock provider responses, verify account linking
- **Test magic link**: Mock Postmark, verify token generation/validation
- **Test CASL rules**: Unit test ability rules for each role
- **Test session enrichment**: Verify org roles and entitlements are loaded
- **Test token refresh**: Mock Discord API, verify token update in DB
- **Test entitlements**: Verify content access based on contentIds and start dates
