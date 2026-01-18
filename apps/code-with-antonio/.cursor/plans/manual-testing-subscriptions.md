# Manual Testing Guide: Team Subscriptions Feature

**Feature Branch:** `vh/feat/cwa/subscriptions`  
**Date:** January 15, 2026

---

## Prerequisites

Before testing, ensure:

1. **Database Setup**
   - `subscription_access` entitlement type exists in `entitlementTypes` table
   - Run any pending migrations

2. **Stripe Setup**
   - Stripe test mode enabled
   - Webhook endpoint configured for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
   - At least one membership product with recurring price

3. **Environment**
   - Dev server running (`pnpm dev`)
   - Inngest dev server running (check terminal)
   - Test user accounts available

4. **Test Cards**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

---

## Test Flows

### Flow 1: Single-Seat Subscription Purchase

**Objective:** Verify single-seat subscription creates entitlement automatically

#### Steps

1. **Navigate to subscription product page**
   - [ ] Go to `/products/{membership-slug}`
   - [ ] Verify "Subscribe" button is displayed (not "Buy Now")
   - [ ] Price shows interval (e.g., "$X / year")

2. **Complete purchase (logged out)**
   - [ ] Click "Subscribe"
   - [ ] Verify redirect to login page
   - [ ] Log in with test email
   - [ ] Complete Stripe checkout with quantity = 1
   - [ ] Verify redirect to `/welcome?subscriptionId=xxx`

3. **Verify welcome page**
   - [ ] Subscription status shows "active"
   - [ ] Billing details visible (interval, price, next payment date)
   - [ ] "Manage Billing" button present and links to Stripe portal
   - [ ] No team invite section shown (single seat)

4. **Verify content access**
   - [ ] Navigate to a workshop attached to the subscription product
   - [ ] Content should be accessible (no paywall)
   - [ ] Discord invite should be available

5. **Verify profile page**
   - [ ] Go to `/profile`
   - [ ] Subscription section shows status, billing, next payment
   - [ ] "Manage Billing" button works

**Expected Result:** User has immediate access to all content attached to subscription product.

---

### Flow 2: Team Subscription Purchase (Multi-Seat)

**Objective:** Verify team subscription workflow for owner

#### Steps

1. **Purchase team subscription**
   - [ ] Navigate to subscription product
   - [ ] Adjust quantity to 3+ seats
   - [ ] Complete Stripe checkout
   - [ ] Verify redirect to `/welcome?subscriptionId=xxx`

2. **Verify welcome page (team)**
   - [ ] Team invite section is displayed
   - [ ] Shows "X of Y seats used"
   - [ ] Invite link is displayed
   - [ ] "Claim Your Seat" button shown (owner hasn't claimed yet)
   - [ ] No content access until seat is claimed

3. **Owner claims seat**
   - [ ] Click "Claim Your Seat" / "Self Redeem" button
   - [ ] Verify success toast
   - [ ] Seat count updates (1 of Y used)
   - [ ] Owner now appears in member list with "(Owner)" label

4. **Verify owner content access**
   - [ ] Navigate to workshop attached to subscription
   - [ ] Content is accessible
   - [ ] Discord access available

**Expected Result:** Team owner can claim seat and gets content access.

---

### Flow 3: Team Member Invitation

**Objective:** Verify inviting team members by email

#### Pre-requisites
- Flow 2 completed (owner has team subscription with available seats)

#### Steps

1. **Navigate to team page**
   - [ ] Go to `/team`
   - [ ] Team subscription card is displayed
   - [ ] Shows correct seat count

2. **Invite existing user**
   - [ ] Enter email of an existing test user
   - [ ] Click "Invite"
   - [ ] Verify success toast
   - [ ] Member count increases
   - [ ] Invited user appears in member list

3. **Verify invited user access**
   - [ ] Log in as invited user
   - [ ] Navigate to workshop
   - [ ] Content is accessible
   - [ ] Check email received (magic login link)

4. **Invite new user**
   - [ ] Enter email that doesn't exist in system
   - [ ] Click "Invite"
   - [ ] Verify success toast
   - [ ] New user created and appears in member list

5. **Verify new user flow**
   - [ ] Open email link as new user
   - [ ] User is logged in
   - [ ] Content is accessible

**Expected Result:** Both existing and new users can be invited and get access.

---

### Flow 4: Team Member Removal

**Objective:** Verify removing team members

#### Pre-requisites
- Flow 3 completed (team with invited members)

#### Steps

1. **Remove team member (not owner)**
   - [ ] Go to `/team`
   - [ ] Find invited member in list
   - [ ] Click trash/remove icon
   - [ ] Confirm removal
   - [ ] Verify member removed from list
   - [ ] Seat count decreases

2. **Verify removed user loses access**
   - [ ] Log in as removed user
   - [ ] Navigate to workshop
   - [ ] Paywall should be shown
   - [ ] Discord access should be revoked

3. **Cannot remove owner**
   - [ ] Verify owner row has no remove button
   - [ ] Or verify remove fails with error message

**Expected Result:** Removed members lose access; owner cannot be removed.

---

### Flow 5: Add More Seats

**Objective:** Verify adding seats to existing subscription

#### Pre-requisites
- Flow 2 completed (owner has team subscription)

#### Steps

1. **Add seats from team page**
   - [ ] Go to `/team`
   - [ ] Click "Add More Seats" button
   - [ ] Enter number of seats to add (e.g., 2)
   - [ ] Click "Add Seats"
   - [ ] Verify proration notice shown

2. **Verify Stripe update**
   - [ ] Check Stripe dashboard - quantity updated
   - [ ] Check local DB - `subscription.fields.seats` updated

3. **Verify new seats available**
   - [ ] Seat count shows new total
   - [ ] Can invite additional members

**Expected Result:** Seats added with proration; can invite more members.

---

### Flow 6: Subscription Cancellation (Scheduled)

**Objective:** Verify scheduled cancellation handling

#### Steps

1. **Cancel subscription in Stripe**
   - [ ] Go to Stripe dashboard
   - [ ] Find test subscription
   - [ ] Click "Cancel" → "At end of period"
   - [ ] Verify webhook fires

2. **Verify local state**
   - [ ] Check Inngest logs for `handle-subscription-updated` function
   - [ ] Entitlement `expiresAt` updated to period end date

3. **Verify user still has access**
   - [ ] User can still access content
   - [ ] Warning shown about upcoming cancellation

4. **Undo cancellation**
   - [ ] Go back to Stripe dashboard
   - [ ] Reactivate subscription
   - [ ] Verify entitlement expiration cleared/extended

**Expected Result:** Access continues until period end; can undo cancellation.

---

### Flow 7: Subscription Immediate Cancellation

**Objective:** Verify immediate cancellation (unpaid/canceled status)

#### Steps

1. **Force cancel in Stripe**
   - [ ] Go to Stripe dashboard
   - [ ] Cancel subscription immediately (not at period end)
   - [ ] Verify webhook fires

2. **Verify entitlements soft deleted**
   - [ ] Check database - entitlements have `deletedAt` set
   - [ ] Subscription status updated to "canceled"

3. **Verify user loses access**
   - [ ] User cannot access content
   - [ ] Discord access revoked

**Expected Result:** Immediate cancellation revokes access.

---

### Flow 8: Subscription Renewal

**Objective:** Verify renewal extends entitlement expiration

#### Steps

1. **Simulate renewal (Stripe CLI)**
   ```bash
   stripe trigger invoice.paid --override 'subscription:previous_attributes.current_period_end=1234567890'
   ```
   Or use Stripe test clock to advance time.

2. **Verify expiration extended**
   - [ ] Check Inngest logs for renewal handling
   - [ ] Entitlement `expiresAt` updated to new period end

**Expected Result:** Entitlement expiration extended on renewal.

---

### Flow 9: Welcome Page Access (Claimed Seat Holder)

**Objective:** Verify claimed seat holder sees appropriate welcome page

#### Pre-requisites
- Team subscription with invited member who has access

#### Steps

1. **Invited user accesses welcome page**
   - [ ] Log in as invited team member
   - [ ] Navigate to `/welcome?subscriptionId=xxx`

2. **Verify limited view**
   - [ ] Subscription status shown
   - [ ] NO billing details shown
   - [ ] NO "Manage Billing" button
   - [ ] Team section may or may not be visible (only owner manages)

**Expected Result:** Non-owners don't see billing information.

---

### Flow 10: Billing Portal Access Control

**Objective:** Verify only owners can access billing

#### Steps

1. **Owner accesses billing**
   - [ ] Log in as subscription owner
   - [ ] Go to `/profile`
   - [ ] "Manage Billing" button visible
   - [ ] Clicking opens Stripe billing portal

2. **Team member billing access**
   - [ ] Log in as team member (not owner)
   - [ ] Go to `/profile`
   - [ ] Subscription section should NOT show billing details
   - [ ] NO "Manage Billing" button

**Expected Result:** Only owners see billing management options.

---

### Flow 11: Product Edit - Membership Configuration

**Objective:** Verify membership product configuration in admin

#### Steps

1. **Edit membership product**
   - [ ] Go to `/products/{slug}/edit` as admin
   - [ ] Change product type to "membership"
   - [ ] Verify new fields appear:
     - Billing Interval (Monthly/Yearly)
     - Subscription Tier (Standard/Pro)

2. **Update billing interval**
   - [ ] Change from "Yearly" to "Monthly"
   - [ ] Save product
   - [ ] Verify Stripe price recreated with recurring interval

3. **Update subscription tier**
   - [ ] Change tier to "Pro"
   - [ ] Save product
   - [ ] Verify tier stored in product fields

**Expected Result:** Membership configuration updates Stripe correctly.

---

### Flow 12: Navigation Menu Updates

**Objective:** Verify team menu item appears for team owners

#### Steps

1. **User with no team**
   - [ ] Log in as user with no bulk purchase or team subscription
   - [ ] Open user menu
   - [ ] "Your Team" link should NOT appear

2. **User with team subscription**
   - [ ] Log in as team subscription owner
   - [ ] Open user menu
   - [ ] "Your Team" link should appear

3. **Team member (not owner)**
   - [ ] Log in as invited team member
   - [ ] "Your Team" link should NOT appear (only owners manage)

**Expected Result:** Team menu only for team owners.

---

### Flow 13: Subscription Tier Access (If Implemented)

**Objective:** Verify tier-based content access

#### Pre-requisites
- Products with different tiers configured
- Workshops/content with tier metadata

#### Steps

1. **Standard tier subscription**
   - [ ] Purchase standard tier subscription
   - [ ] Access standard tier content ✓
   - [ ] Access pro tier content ✗ (paywall)

2. **Pro tier subscription**
   - [ ] Purchase pro tier subscription
   - [ ] Access standard tier content ✓
   - [ ] Access pro tier content ✓

**Expected Result:** Tier hierarchy enforced.

---

## Edge Cases to Test

### Concurrent Actions

1. **Simultaneous seat claims**
   - [ ] Two users try to claim last seat at same time
   - [ ] Only one should succeed
   - [ ] Other gets "No seats available" error

2. **Invite while at capacity**
   - [ ] Fill all seats
   - [ ] Try to invite another user
   - [ ] Should get "No seats available" error

### Error Handling

1. **Invalid email invite**
   - [ ] Enter invalid email format
   - [ ] Should show validation error

2. **Duplicate invite**
   - [ ] Invite same user twice
   - [ ] Should get "already has a seat" error

3. **Remove non-existent member**
   - [ ] Try to remove user not in team
   - [ ] Should handle gracefully

### Webhook Failures

1. **Missing subscription record**
   - [ ] Simulate webhook for non-existent subscription ID
   - [ ] Should log warning and skip (not crash)

---

## Test Data Cleanup

After testing, clean up:

1. **Stripe**
   - Cancel test subscriptions
   - Delete test customers (optional)

2. **Database**
   - Remove test entitlements
   - Reset subscription records
   - Or use separate test database

---

## Reporting Issues

When reporting issues, include:

1. **Steps to reproduce** (which flow, which step)
2. **Expected vs actual behavior**
3. **Screenshots** (especially for UI issues)
4. **Console errors** (browser dev tools)
5. **Inngest logs** (for webhook issues)
6. **Stripe event IDs** (for payment issues)

---

## Quick Checklist

### Happy Path ✓
- [ ] Single-seat purchase → immediate access
- [ ] Team purchase → owner claims → access
- [ ] Invite → member gets access
- [ ] Remove → member loses access
- [ ] Add seats → can invite more
- [ ] Cancel at end → access until then
- [ ] Immediate cancel → access revoked

### UI/UX ✓
- [ ] Subscribe button for memberships
- [ ] Team section on welcome page
- [ ] Team page shows subscriptions
- [ ] Profile shows subscription details
- [ ] Billing hidden from non-owners
- [ ] Team menu item visibility

### Webhooks ✓
- [ ] Checkout → subscription created
- [ ] Update → status synced
- [ ] Cancel → entitlements expired/deleted
- [ ] Renewal → expiration extended
- [ ] Quantity change → seats synced
