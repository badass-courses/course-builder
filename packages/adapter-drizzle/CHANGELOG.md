# @coursebuilder/adapter-drizzle

## 0.5.1

### Patch Changes

- [#247](https://github.com/badass-courses/course-builder/pull/247) [`25f1e5e`](https://github.com/badass-courses/course-builder/commit/25f1e5efc39524d27172f8cce4902cbacc11c2a4) Thanks [@joelhooks](https://github.com/joelhooks)! - removes legacy bulkPurchaseId column from coupon table

- [#248](https://github.com/badass-courses/course-builder/pull/248) [`b685ecb`](https://github.com/badass-courses/course-builder/commit/b685ecbb07ef37dcaf63136fd6202d56514f4dc9) Thanks [@vojtaholik](https://github.com/vojtaholik)! - correctly return redeemedBulkCouponPurchases

- [`624e04a`](https://github.com/badass-courses/course-builder/commit/624e04aa830cdbc7bedc302466363aa1a3831cea) Thanks [@vojtaholik](https://github.com/vojtaholik)! - implement getProductResources handler

- [#235](https://github.com/badass-courses/course-builder/pull/235) [`bccc308`](https://github.com/badass-courses/course-builder/commit/bccc3084077ab2bf24f1ac9361c3c13936749c6a) Thanks [@joelhooks](https://github.com/joelhooks)! - improved progress loading for module

- [#245](https://github.com/badass-courses/course-builder/pull/245) [`5bfac50`](https://github.com/badass-courses/course-builder/commit/5bfac5047ccc81f563d53a4b7780fcf14edf2bf8) Thanks [@joelhooks](https://github.com/joelhooks)! - properly identify bulk purchases

- [#219](https://github.com/badass-courses/course-builder/pull/219) [`e32549a`](https://github.com/badass-courses/course-builder/commit/e32549ab4f0e903a467120a35ab27ef44892b115) Thanks [@joelhooks](https://github.com/joelhooks)! - removeResourceResource so content resources can be detached from parent

- [#221](https://github.com/badass-courses/course-builder/pull/221) [`a5ff185`](https://github.com/badass-courses/course-builder/commit/a5ff1856f912badecea337b014df525b950badc1) Thanks [@vojtaholik](https://github.com/vojtaholik)! - update redeemFullPriceCoupon method to return useful error message when trying to redeem existing purchase

## 0.5.0

### Minor Changes

- [#186](https://github.com/badass-courses/course-builder/pull/186) [`080337e`](https://github.com/badass-courses/course-builder/commit/080337ef60c1e62e762673266b2478b7cd141b33) Thanks [@joelhooks](https://github.com/joelhooks)! - database schema alignment with Skill Stack so that porting those apps will be easier

### Patch Changes

- [#188](https://github.com/badass-courses/course-builder/pull/188) [`5f45e26`](https://github.com/badass-courses/course-builder/commit/5f45e2637c3742e88f7f26127356710edac5b763) Thanks [@vojtaholik](https://github.com/vojtaholik)! - make getModuleProgressForUser support exercise solutions

- [#183](https://github.com/badass-courses/course-builder/pull/183) [`9421c4f`](https://github.com/badass-courses/course-builder/commit/9421c4f1db7eb84728abca79bf68acb0b5ee2671) Thanks [@joelhooks](https://github.com/joelhooks)! - adds a state machine to pricing component

- [#188](https://github.com/badass-courses/course-builder/pull/188) [`2e87fdd`](https://github.com/badass-courses/course-builder/commit/2e87fdd4397848939dbcc8cb7b0fae53267fdc62) Thanks [@vojtaholik](https://github.com/vojtaholik)! - pull nested resources for getContentResource

- [#188](https://github.com/badass-courses/course-builder/pull/188) [`de432b7`](https://github.com/badass-courses/course-builder/commit/de432b78352899adbb830dec8872e82af8823e20) Thanks [@vojtaholik](https://github.com/vojtaholik)! - update(getModuleProgressForUser): filter out solution from nextResource data

## 0.4.0

### Minor Changes

- [#178](https://github.com/badass-courses/course-builder/pull/178) [`585bbb6`](https://github.com/badass-courses/course-builder/commit/585bbb68b9768d7dbf73069c45c109ff034c27d0) Thanks [@vojtaholik](https://github.com/vojtaholik)! - fix user getter inside module progress

- [#178](https://github.com/badass-courses/course-builder/pull/178) [`a67618f`](https://github.com/badass-courses/course-builder/commit/a67618fa647a0aafec6cb29d0ef38f74a92eeb76) Thanks [@vojtaholik](https://github.com/vojtaholik)! - safely parse user in module progress getter

### Patch Changes

- [`4e75ba0`](https://github.com/badass-courses/course-builder/commit/4e75ba07396beb7ecf66c1d736fba1c109fa3e9f) Thanks [@joelhooks](https://github.com/joelhooks)! - tweaks for coupons

## 0.3.0

### Minor Changes

- [`25e4d69`](https://github.com/badass-courses/course-builder/commit/25e4d69928b2ec2fb61946dc327525a86902e027) Thanks [@vojtaholik](https://github.com/vojtaholik)! - next progress resource is nullable

### Patch Changes

- [#176](https://github.com/badass-courses/course-builder/pull/176) [`a939e2b`](https://github.com/badass-courses/course-builder/commit/a939e2baa850a54167c800f83ba32030d6b6da4b) Thanks [@joelhooks](https://github.com/joelhooks)! - commerce functionality for ProAWS

- [#177](https://github.com/badass-courses/course-builder/pull/177) [`2d2be35`](https://github.com/badass-courses/course-builder/commit/2d2be35b50bdce90e111338dd788cb856c952e49) Thanks [@joelhooks](https://github.com/joelhooks)! - adding events as products to proaws

## 0.2.0

### Minor Changes

- [`7ae7363`](https://github.com/badass-courses/course-builder/commit/7ae7363f3655fb123bc28b4cd2f249e9d082fec3) Thanks [@vojtaholik](https://github.com/vojtaholik)! - updates module progress getter

### Patch Changes

- [#168](https://github.com/badass-courses/course-builder/pull/168) [`9d900b2`](https://github.com/badass-courses/course-builder/commit/9d900b217a8d8ee1fdee1a9e0ae24b58e87773cc) Thanks [@joelhooks](https://github.com/joelhooks)! - updates features of the pricing grid and lookup

- [#170](https://github.com/badass-courses/course-builder/pull/170) [`22c290a`](https://github.com/badass-courses/course-builder/commit/22c290ad7eec68e664c0027ba9389af41c71a16a) Thanks [@joelhooks](https://github.com/joelhooks)! - enables purchase transfers end to end

- [#171](https://github.com/badass-courses/course-builder/pull/171) [`78d8536`](https://github.com/badass-courses/course-builder/commit/78d8536c4944ab1f98a6376ad9dcc8baac9fc2ff) Thanks [@joelhooks](https://github.com/joelhooks)! - enables coupon redemption for 100% of "golden tickets"

## 0.1.4

### Patch Changes

- [#161](https://github.com/badass-courses/course-builder/pull/161) [`acce952`](https://github.com/badass-courses/course-builder/commit/acce95260e808a74b94c81c165ff296c014d27ff) Thanks [@joelhooks](https://github.com/joelhooks)! - product crud ui and roundtrip to stripe for updates

- [#162](https://github.com/badass-courses/course-builder/pull/162) [`480d095`](https://github.com/badass-courses/course-builder/commit/480d09554cd0e645ea33b8d5533be53e3f2ef250) Thanks [@joelhooks](https://github.com/joelhooks)! - adds progress router and adapter method

- [#167](https://github.com/badass-courses/course-builder/pull/167) [`39b0ef5`](https://github.com/badass-courses/course-builder/commit/39b0ef5e4556ee1a1fd549f3bc48f405fe8b6984) Thanks [@joelhooks](https://github.com/joelhooks)! - redemptions and purchase recording with an email at the end

- [#156](https://github.com/badass-courses/course-builder/pull/156) [`18169be`](https://github.com/badass-courses/course-builder/commit/18169be84613cac1cc2d35bc6cd386eaf803f53f) Thanks [@joelhooks](https://github.com/joelhooks)! - migrates commerce flows from Skill Stack into Course Builder

## 0.1.3

### Patch Changes

- [`1e669e3`](https://github.com/badass-courses/course-builder/commit/1e669e3c91c90b7a71bf4157b6ac1444f14b80b1) Thanks [@joelhooks](https://github.com/joelhooks)! - make roles association correct

## 0.1.2

### Patch Changes

- [#148](https://github.com/badass-courses/course-builder/pull/148) [`8e5d28e`](https://github.com/badass-courses/course-builder/commit/8e5d28eb27c3c4fc6f181c4d1e118aa23828c0c4) Thanks [@joelhooks](https://github.com/joelhooks)! - general cleanup

## 0.1.1

### Patch Changes

- [#144](https://github.com/badass-courses/course-builder/pull/144) [`2b1ee5b`](https://github.com/badass-courses/course-builder/commit/2b1ee5bfddc417f5f8112f297e03b4ad8d281aa0) Thanks [@joelhooks](https://github.com/joelhooks)! - adds LLM provider (openai) to core

## 0.1.0

### Minor Changes

- [#139](https://github.com/badass-courses/course-builder/pull/139) [`7e422eb`](https://github.com/badass-courses/course-builder/commit/7e422eb3f19aa99f465f444e4180635dac5baa50) Thanks [@joelhooks](https://github.com/joelhooks)! - starts the process for migrating the `prisma-api` from Skill Stack

## 0.0.7

### Patch Changes

- [#126](https://github.com/badass-courses/course-builder/pull/126) [`0b590f9`](https://github.com/badass-courses/course-builder/commit/0b590f984b038d951fc2bceb243415e0cf49ce20) Thanks [@joelhooks](https://github.com/joelhooks)! - updates next-auth and auth-core and gives a "session" to coursebuilder

## 0.0.6

### Patch Changes

- [#124](https://github.com/badass-courses/course-builder/pull/124) [`25df89a`](https://github.com/badass-courses/course-builder/commit/25df89a0524e8c340bbd4898fa369df3c9e2b720) Thanks [@joelhooks](https://github.com/joelhooks)! - integrates vitest for testing core and adapter-drizzle

## 0.0.5

### Patch Changes

- [#121](https://github.com/badass-courses/course-builder/pull/121) [`250abc1db555d9f49960679964fd1b12243297fb`](https://github.com/badass-courses/course-builder/commit/250abc1db555d9f49960679964fd1b12243297fb) Thanks [@joelhooks](https://github.com/joelhooks)! - exports the full mysql schema with relations

## 0.0.4

### Patch Changes

- [`9402139f9ded1656c68daec0a422fa640f34748e`](https://github.com/badass-courses/course-builder/commit/9402139f9ded1656c68daec0a422fa640f34748e) Thanks [@joelhooks](https://github.com/joelhooks)! - adapter-drizzle now exports schemas

## 0.0.3

### Patch Changes

- [#107](https://github.com/badass-courses/course-builder/pull/107) [`cc3885f3502e72873213a2fbccd58b684b653747`](https://github.com/badass-courses/course-builder/commit/cc3885f3502e72873213a2fbccd58b684b653747) Thanks [@joelhooks](https://github.com/joelhooks)! - migrates all video processing workflows into `core` for both inngest and database adapter

## 0.0.2

### Patch Changes

- [#104](https://github.com/badass-courses/course-builder/pull/104) [`2def195558d69b00ce6c1001781215c97488a99b`](https://github.com/badass-courses/course-builder/commit/2def195558d69b00ce6c1001781215c97488a99b) Thanks [@joelhooks](https://github.com/joelhooks)! - adding adapter and core packages to extend the pattern that is presented by authjs to include Course Builder `contentResource` schema

  this approach will allow us to maintain adapters for mysql, sqlite, and pg, potentially beyond drizzle if needed
