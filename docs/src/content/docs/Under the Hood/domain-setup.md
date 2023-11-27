---
title: Setting up Your Domain
description: Make life easier later. 
---

Once you've purchased your domain, there are a few setup chores that will 
make life easier down the road.

## Setup Google Workspaces

You'll need a Google Workspace. There are probably other options, but Google 
makes life relatively simple so that's what we recommend.

### Sign Up for a Basic Workspace

We always start at this page and choose `basic`: https://workspace.google.com/pricing.html

There are situations where they will try and railroad you in to a higher 
priced plan, but we don't need that. We want the cheapest possible plan.

:::caution
This process requires a phone number for verification. It's possible to 
reach a limit on how many accounts a single phone number can verify 😭
:::

They will require you to confirm your domain during this process which 
requires adding a `txt` DNS entry.

### Setup a catch-all Email Address

We use a `team@example.com` email address as a _catch-all_ email address.

The catch-all email address allows us to use a single (shared) login for the 
product, which is useful for support and maintenance. We could add per-user 
emails, but instead we use a shared inbox via [Front](https://front.com). 
With this setup we can **send** from **any** email address as the reply-to, 
and it will land in the support inbox.

:::tip
This is excellent in practice because being able to have multi-user in 
practice is a lifesaver down the road.
:::

## Configure Your Domain for Mail

Hopefully your host has a nice one-click Google Workspaces setup button, but 
if not you'll want to [follow these instructions to setup your DNS for Google 
Workspaces](https://support.google.com/a/answer/140034).

Once that is complete, you'll be able to send/recieve email to your new 
email address!