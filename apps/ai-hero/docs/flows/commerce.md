# Commerce Flow Documentation

## Overview

The ai-hero commerce system handles product purchases through Stripe integration, manages entitlements for content access, supports team/bulk purchases, and integrates with external services (Discord, ConvertKit). The system supports both one-time purchases and subscriptions.

### Key Components

- **Stripe Integration**: Payment processing via Stripe Checkout
- **Entitlements System**: Granular access control for content and features
- **Purchase Types**: Individual, team/bulk, full-price coupon redemption
- **Product Types**: Cohorts (time-based workshops) and self-paced workshops
- **Coupon System**: Stackable coupons with eligibility conditions
- **Post-Purchase Workflows**: Email, Discord roles, ConvertKit integration

---

## 1. Stripe Checkout Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant tRPC as tRPC Router
    participant Pricing as Pricing Service
    participant Stripe
    participant DB

    User->>Frontend: Select product & quantity
    Frontend->>tRPC: pricing.formatted(productId, quantity, couponId)

    tRPC->>Pricing: checkForAvailableUpgrades()
    Pricing->>DB: Get user purchases
    DB-->>Pricing: Existing purchases
    Pricing-->>tRPC: Upgrade purchase ID (if applicable)

    tRPC->>Pricing: checkForAvailableCoupons()
    Pricing->>DB: Get default coupon & entitlement coupons
    DB-->>Pricing: Available coupons
    Pricing->>Pricing: Compare discounts (use bigger)
    Pricing-->>tRPC: Active merchant coupon

    tRPC->>Pricing: formatPricesForProduct()
    Note over Pricing: Calculate final price with:<br/>- Base price<br/>- PPP discount<br/>- Coupon discount<br/>- Upgrade credit<br/>- Stacking (if entitlement exists)
    Pricing-->>tRPC: Formatted price

    tRPC-->>Frontend: Price details

    User->>Frontend: Click "Buy Now"
    Frontend->>Stripe: Create checkout session
    Note over Frontend,Stripe: Include metadata:<br/>- productId<br/>- organizationId<br/>- couponId<br/>- usedEntitlementCouponIds
    Stripe-->>Frontend: Checkout URL
    Frontend->>Stripe: Redirect to checkout

    User->>Stripe: Complete payment
    Stripe->>tRPC: Webhook: checkout.session.completed
```

---

## 2. Stripe Webhook Handling (Purchase Creation)

```mermaid
sequenceDiagram
    participant Stripe
    participant Webhook as Stripe Webhook Handler
    participant Inngest
    participant DB
    participant Purchase as Purchase Workflow

    Stripe->>Webhook: checkout.session.completed event

    alt mode == 'subscription'
        Webhook->>Inngest: Trigger subscription handler
        Note over Inngest: See Subscription Flow
    else mode == 'payment'
        Webhook->>DB: Parse checkout session
        Webhook->>DB: findOrCreateUser(email)
        DB-->>Webhook: User

        Webhook->>DB: Get/create merchant records
        Note over Webhook,DB: - MerchantAccount<br/>- MerchantCustomer<br/>- MerchantProduct<br/>- MerchantCharge<br/>- MerchantSession

        Webhook->>DB: Create Purchase
        Note over Webhook,DB: Parse metadata:<br/>- productId<br/>- organizationId<br/>- bulk coupon info<br/>- upgrade info<br/>- coupon usage
        DB-->>Webhook: Purchase created

        Webhook->>Inngest: Send NEW_PURCHASE_CREATED_EVENT
        Note over Inngest: Event includes:<br/>- purchaseId<br/>- productType (cohort/self-paced)<br/>- checkoutSessionId

        Inngest->>Purchase: Trigger post-purchase-workflow
    end
```

---

## 3. Entitlement Granting Flow

```mermaid
flowchart TD
    A[Purchase Created] --> B{Purchase Type?}

    B -->|Individual Purchase| C[Ensure Organization Membership]
    B -->|Team Purchase| D[Get Bulk Coupon]
    B -->|Coupon Redemption| E[Get Original Bulk Purchase]

    C --> F[Get Resource Contexts]
    D --> G[Send Team Welcome Email]
    E --> F
    G --> END

    F --> H{Iterate Resources}

    H --> I[Get Entitlement Types]
    I --> J[cohort_content_access<br/>OR workshop_content_access]
    I --> K[cohort_discord_role<br/>OR workshop_discord_role]

    J --> L{Check Existing Entitlement}
    L -->|Not Exists| M[Create Content Access Entitlement]
    L -->|Already Exists| N[Skip - Log Duplicate]

    K --> O[Create Discord Role Entitlement]
    O --> P[Send Discord Role Event]

    M --> Q[Send Welcome Email]
    N --> Q
    P --> Q

    Q --> R{More Resources?}
    R -->|Yes| H
    R -->|No| END[Workflow Complete]

    style M fill:#90EE90
    style O fill:#87CEEB
    style Q fill:#FFD700
```

---

## 4. Post-Purchase Workflow (Individual)

```mermaid
sequenceDiagram
    participant Inngest
    participant DB
    participant Entitlements as Entitlement Service
    participant Discord
    participant Email as Email Service
    participant CK as ConvertKit

    Inngest->>DB: Get purchase, product, user

    Inngest->>Inngest: Send GRANT_COUPON_ENTITLEMENTS event
    Note over Inngest: Grant special credit coupons<br/>if eligibility conditions met

    Inngest->>DB: Mark entitlement coupons as used
    Note over Inngest,DB: Set deletedAt for coupons<br/>used in checkout session

    Inngest->>DB: ensureOrganizationMembership()
    alt Purchase has organizationId
        DB->>DB: Add user to organization
        DB->>DB: Assign 'learner' role
    else No organizationId
        DB->>DB: Ensure personal organization
        DB->>DB: Assign 'learner' role
    end
    DB-->>Inngest: organizationId, membershipId

    Inngest->>DB: Gather resource contexts
    Note over Inngest,DB: Get all resources from product:<br/>- Cohort → Workshops<br/>- Workshop → Sections → Lessons

    loop For each resource context
        Inngest->>DB: Get entitlement types
        Note over DB: - content_access<br/>- discord_role

        Inngest->>Entitlements: createResourceEntitlements()
        Entitlements->>DB: Check existing entitlements
        alt No existing entitlement
            Entitlements->>DB: Create entitlement
            Note over DB: - userId<br/>- organizationId<br/>- organizationMembershipId<br/>- resourceId in metadata.contentIds<br/>- sourceType: PURCHASE<br/>- sourceId: purchaseId
        else Already has entitlement
            Entitlements->>Entitlements: Skip duplicate
        end

        Inngest->>Discord: Send USER_ADDED_TO_COHORT/WORKSHOP event
        Note over Discord: Includes discordRoleId from product

        Inngest->>DB: Create Discord role entitlement
        Note over DB: With discordRoleId in metadata

        Inngest->>Email: Send welcome email
        Note over Email: Variant based on:<br/>- Product type (cohort/workshop)<br/>- Team vs individual<br/>- Coupon redemption
    end
```

---

## 5. Coupon Entitlement Granting

```mermaid
flowchart TD
    A[GRANT_COUPON_ENTITLEMENTS event] --> B{Eligibility Check}

    B -->|Not Eligible| Z[Return: Not eligible]
    B -->|Eligible| C{Calculate Amount}

    C -->|Valid Purchase| D[Use product unit price]
    C -->|Restricted Purchase| E[Use purchase total amount]

    D --> F[Convert to cents]
    E --> F

    F --> G[Find coupons with eligibility<br/>for this productId]

    G --> H{Any coupons exist?}
    H -->|No| Z
    H -->|Yes| I{Already has entitlement<br/>for this product?}

    I -->|Yes| Z
    I -->|No| J{Purchase Status?}

    J -->|Valid| K[Find matching coupon<br/>amount = product price]
    J -->|Restricted| L{Matching coupon exists?}

    K --> M{Coupon found?}
    M -->|Yes| N[Grant entitlement]
    M -->|No| Z

    L -->|Yes| N
    L -->|No| O[Create merchant coupon in Stripe]
    O --> P[Create site coupon record]
    P --> N

    N --> Q[ensurePersonalOrganization]
    Q --> R[Insert entitlement record]
    R --> S[Log success]

    style N fill:#90EE90
    style O fill:#FFB6C1
    style R fill:#87CEEB
```

### Coupon Eligibility Logic

- **Valid Purchase**: Product has a defined price → grant coupon matching that price
- **Restricted Purchase**: Purchase has PPP/discount → create/find coupon for actual paid amount
- **Eligibility Condition**: Coupons have `fields.eligibilityCondition.productId` pointing to the purchased product
- **Entitlement Type**: `apply_special_credit` stored as `COUPON` source type

---

## 6. Team/Bulk Purchase Flow

```mermaid
sequenceDiagram
    participant Buyer
    participant Stripe
    participant Webhook
    participant DB
    participant Email

    Buyer->>Stripe: Purchase with quantity > 1
    Stripe->>Webhook: checkout.session.completed

    Webhook->>DB: Create purchase with bulkCouponId
    Webhook->>DB: Create bulk coupon
    Note over DB: - maxUses = quantity<br/>- restrictedToProductId<br/>- 100% discount

    Webhook->>Email: Send team purchaser email
    Note over Email: Includes:<br/>- Coupon code<br/>- Quantity purchased<br/>- Redemption instructions

    Note over Buyer: Share coupon code with team

    participant Member
    Member->>Stripe: Redeem coupon code
    Note over Member,Stripe: Full-price coupon (100% off)

    Stripe->>Webhook: checkout.session.completed
    Webhook->>DB: Create purchase with redeemedBulkCouponId

    Webhook->>DB: Trigger POST_PURCHASE_WORKFLOW
    Note over DB: Event: FULL_PRICE_COUPON_REDEEMED

    DB->>DB: Grant entitlements to member
    DB->>DB: Set invitedById = original purchaser
    DB->>Email: Send redeemer welcome email
```

---

## 7. Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ PURCHASE : makes
    USER ||--o{ ORGANIZATION_MEMBERSHIP : has
    USER ||--o{ ENTITLEMENT : has

    PURCHASE ||--|| PRODUCT : for
    PURCHASE }o--|| MERCHANT_CHARGE : has
    PURCHASE }o--|| MERCHANT_SESSION : tracked_by
    PURCHASE }o--o| COUPON : uses
    PURCHASE }o--o| COUPON : creates_bulk
    PURCHASE }o--o| PURCHASE : upgrades_from
    PURCHASE ||--o{ ENTITLEMENT : grants

    PRODUCT ||--o{ PRICE : has
    PRODUCT ||--o{ CONTENT_RESOURCE : contains
    PRODUCT }o--|| MERCHANT_PRODUCT : linked_to

    COUPON }o--|| MERCHANT_COUPON : uses
    COUPON ||--o{ ENTITLEMENT : grants

    ORGANIZATION ||--o{ ORGANIZATION_MEMBERSHIP : has
    ORGANIZATION ||--o{ ENTITLEMENT : scopes

    ORGANIZATION_MEMBERSHIP ||--o{ ENTITLEMENT : receives
    ORGANIZATION_MEMBERSHIP }o--o{ ORGANIZATION_MEMBERSHIP_ROLE : has

    ENTITLEMENT }o--|| ENTITLEMENT_TYPE : of_type
    ENTITLEMENT }o--|| CONTENT_RESOURCE : for_resource

    MERCHANT_ACCOUNT ||--o{ MERCHANT_CUSTOMER : has
    MERCHANT_ACCOUNT ||--o{ MERCHANT_PRODUCT : has
    MERCHANT_ACCOUNT ||--o{ MERCHANT_COUPON : manages

    MERCHANT_CUSTOMER ||--o{ MERCHANT_CHARGE : charged
    MERCHANT_CUSTOMER ||--o{ MERCHANT_SUBSCRIPTION : subscribes_to

    SUBSCRIPTION }o--|| MERCHANT_SUBSCRIPTION : tracked_by
    SUBSCRIPTION }o--|| PRODUCT : for
    SUBSCRIPTION }o--|| ORGANIZATION : belongs_to

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
        string organizationId FK
        decimal totalAmount
        string status
        string bulkCouponId FK
        string redeemedBulkCouponId FK
        string upgradeFromPurchaseId FK
        string merchantChargeId FK
        json fields
        timestamp createdAt
    }

    PRODUCT {
        string id PK
        string name
        string type
        int status
        int quantityAvailable
        json fields
        timestamp createdAt
    }

    COUPON {
        string id PK
        string merchantCouponId FK
        int maxUses
        int usedCount
        int amountDiscount
        decimal percentageDiscount
        timestamp expires
        int status
        json fields
    }

    ENTITLEMENT {
        string id PK
        string userId FK
        string organizationId FK
        string organizationMembershipId FK
        string entitlementType FK
        string sourceType
        string sourceId
        json metadata
        timestamp expiresAt
        timestamp deletedAt
        timestamp createdAt
    }

    ENTITLEMENT_TYPE {
        string id PK
        string name
        json fields
    }

    ORGANIZATION {
        string id PK
        string name
        timestamp createdAt
    }

    ORGANIZATION_MEMBERSHIP {
        string id PK
        string userId FK
        string organizationId FK
        string invitedById FK
        json fields
        timestamp createdAt
    }
```

---

## 8. Key Entitlement Types

| Entitlement Type | Purpose | Granted By | Metadata |
|-----------------|---------|------------|----------|
| `cohort_content_access` | Access to cohort workshops and lessons | Purchase, Transfer | `contentIds: [resourceId]` |
| `workshop_content_access` | Access to self-paced workshop content | Purchase, Transfer | `contentIds: [resourceId]` |
| `cohort_discord_role` | Discord role for cohort participants | Purchase | `discordRoleId` |
| `workshop_discord_role` | Discord role for workshop participants | Purchase | `discordRoleId` |
| `apply_special_credit` | Stackable coupon credit for future purchases | Coupon eligibility | `eligibilityProductId` |
| `subscription_tier` | Subscription-based access | Subscription | Tier details |

---

## 9. Subscription Flow

```mermaid
sequenceDiagram
    participant User
    participant Stripe
    participant Webhook
    participant DB
    participant Inngest

    User->>Stripe: Subscribe via checkout
    Stripe->>Webhook: checkout.session.completed (mode=subscription)

    Webhook->>DB: Parse subscription info
    Webhook->>DB: findOrCreateUser(email)
    DB-->>Webhook: User

    Webhook->>DB: Get or ensure organization
    Note over Webhook,DB: Use metadata.organizationId<br/>or personal organization

    Webhook->>DB: Create merchant records
    Note over DB: - MerchantSession<br/>- MerchantCustomer<br/>- MerchantSubscription

    Webhook->>DB: Create Subscription record
    Note over DB: Link to:<br/>- merchantSubscriptionId<br/>- organizationId<br/>- productId

    Webhook->>DB: Add learner role to member

    Webhook->>Inngest: NEW_SUBSCRIPTION_CREATED event
    Inngest->>Inngest: Process subscription benefits
    Note over Inngest: Grant subscription entitlements<br/>based on tier
```

---

## 10. Refund & Entitlement Revocation

When a refund occurs:

1. **Stripe webhook** receives `charge.refunded` event
2. **Soft delete purchase entitlements**: Set `deletedAt` on all entitlements with `sourceType=PURCHASE` and `sourceId=purchaseId`
3. **Revoke credit entitlements**: Find and soft delete any `apply_special_credit` entitlements where `metadata.eligibilityProductId` matches the refunded product
4. **Discord role removal**: Trigger event to remove Discord roles
5. **Update purchase status**: Mark purchase as `Refunded`

---

## 11. Integration Points

### Discord Integration
- **Event**: `USER_ADDED_TO_COHORT_EVENT` or `USER_ADDED_TO_WORKSHOP_EVENT`
- **Handler**: `add-discord-role-workflow.ts`
- **Flow**: Looks up Discord user by email → assigns role via Discord API

### ConvertKit Integration
- **Triggered by**: Welcome emails and specific events
- **Purpose**: Add subscribers to email sequences
- **Tags**: Based on product type and purchase status

### Shortlink Attribution
- **Purpose**: Track referral sources for purchases
- **Flow**: Cookie-based attribution → linked to purchase on completion
- **Handler**: `shortlink-attribution` inngest function

---

## 12. Price Calculation Logic

```typescript
// Simplified pricing logic
finalPrice = basePrice
  - pppDiscount        // Country-based purchasing power parity
  - couponDiscount     // Applied coupon (default or user-provided)
  - upgradeCredit      // Credit from previous purchase
  - stackedCredit      // Additional credit from entitlement coupon (if preferStacking=true)

// Stacking only enabled when:
// - User has active 'apply_special_credit' entitlement
// - preferStacking flag is true
// - Credit is applied ON TOP of other discounts
```

### Discount Priority
1. Check for **upgrade** opportunities
2. Compare **user coupon** vs **default site coupon** → pick bigger discount
3. Apply **PPP discount** if enabled
4. Apply **entitlement credit** if stacking enabled

---

## Summary

The commerce system is designed around:
- **Flexibility**: Supports multiple product types, purchase modes, and discount strategies
- **Entitlements**: Granular, time-bounded access control with soft deletes
- **Observability**: Extensive logging at each step for debugging
- **Integration**: Seamless connections to Stripe, Discord, email services
- **Team Support**: Native bulk purchase and redemption flows
- **Upgrade Paths**: Built-in support for product upgrades with credit
