# @coursebuilder/core

## 1.2.0

### Minor Changes

- [#578](https://github.com/badass-courses/course-builder/pull/578)
  [`f11c60f`](https://github.com/badass-courses/course-builder/commit/f11c60f9b08d7955ea840af15cc0d14d7c44f633)
  Thanks [@zacjones93](https://github.com/zacjones93)! - Add fixed amount
  discount functionality for merchant coupons with proper dollar-based pricing
  throughout the pricing system. This includes converting fixed discount amounts
  from cents to dollars (breaking change), displaying fixed discount amounts in
  pricing components, and adding shared pricing UI components for discount
  visualization.

### Patch Changes

- [#587](https://github.com/badass-courses/course-builder/pull/587)
  [`fff302b`](https://github.com/badass-courses/course-builder/commit/fff302b9a483f8d9b6209bf5ec3fa57830c3e8e9)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - extract cohort and
  workshop creation to adapter and add tests

- [#579](https://github.com/badass-courses/course-builder/pull/579)
  [`5d94d4e`](https://github.com/badass-courses/course-builder/commit/5d94d4e4b634f612228dfa2c081fc96f201d85cc)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - upgrade next to beta,
  update related deps (react, react-dom, eslint, etc)

- [`1b92a3a`](https://github.com/badass-courses/course-builder/commit/1b92a3ac602291f219370fb264d8e0099f54963c)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add openEnrollment and
  closeEnrollment fields to cohort creation

- [`4134b05`](https://github.com/badass-courses/course-builder/commit/4134b05115972b2d6edae4ae4ae8a7a2b10557f3)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add optional retryCount
  to VideoStatusCheckEvent schema and enhance error handling in
  removeCompletedVideo function

- [`18d2d04`](https://github.com/badass-courses/course-builder/commit/18d2d048e0e1083d66f5c929ffedf5452b9f93ef)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bring back non-dynamic
  og image routes

- [`79764de`](https://github.com/badass-courses/course-builder/commit/79764deb0346fca813e01d2e2409712990990d8e)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - dont require
  verify-login redirect

- [`22fe75f`](https://github.com/badass-courses/course-builder/commit/22fe75f78d801e1c053cd6b938a6f376f8eaa147)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - limit retries on
  remove-completed-video inngest function

- [#568](https://github.com/badass-courses/course-builder/pull/568)
  [`a2a97ca`](https://github.com/badass-courses/course-builder/commit/a2a97ca5a411be88db9468e01256fd59096155f9)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - ensure self-paced
  workshop purchasers have org id by redirecting to /verify-login before
  checkout

- [`8267b98`](https://github.com/badass-courses/course-builder/commit/8267b984c6167c12bef8315900764943d0d86087)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - chore: make sure
  availableCoupons is array

- Updated dependencies
  [[`5d94d4e`](https://github.com/badass-courses/course-builder/commit/5d94d4e4b634f612228dfa2c081fc96f201d85cc),
  [`a4dce03`](https://github.com/badass-courses/course-builder/commit/a4dce03ce7e954653d423dd48c66e15c0bd23e4e)]:
  - @coursebuilder/email-templates@1.0.8
  - @coursebuilder/nodash@0.0.3

## 1.1.0

### Minor Changes

- [#578](https://github.com/badass-courses/course-builder/pull/578)
  [`f11c60f`](https://github.com/badass-courses/course-builder/commit/f11c60f9b08d7955ea840af15cc0d14d7c44f633)
  Thanks [@zacjones93](https://github.com/zacjones93)! - Add fixed amount
  discount functionality for merchant coupons with proper dollar-based pricing
  throughout the pricing system. This includes converting fixed discount amounts
  from cents to dollars (breaking change), displaying fixed discount amounts in
  pricing components, and adding shared pricing UI components for discount
  visualization.

### Patch Changes

- [#587](https://github.com/badass-courses/course-builder/pull/587)
  [`fff302b`](https://github.com/badass-courses/course-builder/commit/fff302b9a483f8d9b6209bf5ec3fa57830c3e8e9)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - extract cohort and
  workshop creation to adapter and add tests

- [#579](https://github.com/badass-courses/course-builder/pull/579)
  [`5d94d4e`](https://github.com/badass-courses/course-builder/commit/5d94d4e4b634f612228dfa2c081fc96f201d85cc)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - upgrade next to beta,
  update related deps (react, react-dom, eslint, etc)

- [`1b92a3a`](https://github.com/badass-courses/course-builder/commit/1b92a3ac602291f219370fb264d8e0099f54963c)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add openEnrollment and
  closeEnrollment fields to cohort creation

- [`4134b05`](https://github.com/badass-courses/course-builder/commit/4134b05115972b2d6edae4ae4ae8a7a2b10557f3)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add optional retryCount
  to VideoStatusCheckEvent schema and enhance error handling in
  removeCompletedVideo function

- [`18d2d04`](https://github.com/badass-courses/course-builder/commit/18d2d048e0e1083d66f5c929ffedf5452b9f93ef)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bring back non-dynamic
  og image routes

- [`79764de`](https://github.com/badass-courses/course-builder/commit/79764deb0346fca813e01d2e2409712990990d8e)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - dont require
  verify-login redirect

- [`22fe75f`](https://github.com/badass-courses/course-builder/commit/22fe75f78d801e1c053cd6b938a6f376f8eaa147)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - limit retries on
  remove-completed-video inngest function

- [#568](https://github.com/badass-courses/course-builder/pull/568)
  [`a2a97ca`](https://github.com/badass-courses/course-builder/commit/a2a97ca5a411be88db9468e01256fd59096155f9)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - ensure self-paced
  workshop purchasers have org id by redirecting to /verify-login before
  checkout

- [`8267b98`](https://github.com/badass-courses/course-builder/commit/8267b984c6167c12bef8315900764943d0d86087)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - chore: make sure
  availableCoupons is array

- Updated dependencies
  [[`5d94d4e`](https://github.com/badass-courses/course-builder/commit/5d94d4e4b634f612228dfa2c081fc96f201d85cc),
  [`a4dce03`](https://github.com/badass-courses/course-builder/commit/a4dce03ce7e954653d423dd48c66e15c0bd23e4e)]:
  - @coursebuilder/email-templates@1.0.7
  - @coursebuilder/nodash@0.0.2

## 1.0.6

### Patch Changes

- [#521](https://github.com/badass-courses/course-builder/pull/521)
  [`e6e5e59`](https://github.com/badass-courses/course-builder/commit/e6e5e5924fa540e6f4d88dec408a68c7e50725a9)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add enrollmentOpen and
  enrollmentClose fields to product

- [#534](https://github.com/badass-courses/course-builder/pull/534)
  [`a62e812`](https://github.com/badass-courses/course-builder/commit/a62e812c365c6060acce6914a2bf8019bcff5a4f)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bumps next version

- Updated dependencies
  [[`a62e812`](https://github.com/badass-courses/course-builder/commit/a62e812c365c6060acce6914a2bf8019bcff5a4f)]:
  - @coursebuilder/email-templates@1.0.6

## 1.0.5

### Patch Changes

- [#472](https://github.com/badass-courses/course-builder/pull/472)
  [`ed6b124`](https://github.com/badass-courses/course-builder/commit/ed6b1246b35b40f30cdf27b5507407c26d310424)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - fix team quantity logic

- [#474](https://github.com/badass-courses/course-builder/pull/474)
  [`aa77733`](https://github.com/badass-courses/course-builder/commit/aa77733d0965710f849be83cffe7374ad3e1edf3)
  Thanks [@joelhooks](https://github.com/joelhooks)! - include live products in
  checkout flow

- [#479](https://github.com/badass-courses/course-builder/pull/479)
  [`60e8113`](https://github.com/badass-courses/course-builder/commit/60e811310faab346e385669c9a4ef5a25849ce07)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - refactor assistant

- [`4e29da7`](https://github.com/badass-courses/course-builder/commit/4e29da74a433635089bb2796abbe1339fd8f4dbd)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add ability to pass
  state to NewProduct

- [`639af6d`](https://github.com/badass-courses/course-builder/commit/639af6d499410198e322df38a74b4fa8ec8310df)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - update sold out
  handling in pricing widget and team toggle, improve waitlist styling

- [#471](https://github.com/badass-courses/course-builder/pull/471)
  [`1edb931`](https://github.com/badass-courses/course-builder/commit/1edb9318a1af4869e1685606bf4dae9da5dfb031)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - create
  FullPriceCouponRedeemed event,pass orgId

- [`a34b701`](https://github.com/badass-courses/course-builder/commit/a34b701f70d9ba66d7c291f51db8e63ff81c660a)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add ability to init
  product with a type, fix waitlist logic

## 1.0.4

### Patch Changes

- [#445](https://github.com/badass-courses/course-builder/pull/445)
  [`08b5baf`](https://github.com/badass-courses/course-builder/commit/08b5baf69d334a360db177154e347122be4e6ad1)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bumping various deps

- [#457](https://github.com/badass-courses/course-builder/pull/457)
  [`4a7a143`](https://github.com/badass-courses/course-builder/commit/4a7a1432b5b3c97d730115178d2c3938e15cb7ab)
  Thanks [@joelhooks](https://github.com/joelhooks)! - So many changes

- [#460](https://github.com/badass-courses/course-builder/pull/460)
  [`7a10553`](https://github.com/badass-courses/course-builder/commit/7a105531deaca25b27108ee4308d97900dc154e2)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - pass usedCoupon to
  formattedPricing

- [`af9b3af`](https://github.com/badass-courses/course-builder/commit/af9b3af0b42f3248dc442a089616005eeaef8ecc)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - remove console log

- Updated dependencies
  [[`596b298`](https://github.com/badass-courses/course-builder/commit/596b2980a8485adc2bc5331b527d47b89c095776)]:
  - @coursebuilder/email-templates@1.0.5

## 1.0.3

### Patch Changes

- [#411](https://github.com/badass-courses/course-builder/pull/411)
  [`8aeb7d8`](https://github.com/badass-courses/course-builder/commit/8aeb7d8cd2dca32189a23aa4c61df29cf95fa5af)
  Thanks [@joelhooks](https://github.com/joelhooks)! - tier stuff for cohorts

## 1.0.2

### Patch Changes

- [#409](https://github.com/badass-courses/course-builder/pull/409)
  [`7cb74e7`](https://github.com/badass-courses/course-builder/commit/7cb74e7fcdd558d6687c1e7c22bb902af474bb73)
  Thanks [@joelhooks](https://github.com/joelhooks)! - changes for cohorts

## 1.0.1

### Patch Changes

- [#378](https://github.com/badass-courses/course-builder/pull/378)
  [`c6eda5e`](https://github.com/badass-courses/course-builder/commit/c6eda5e2fd9159146c8bb35620dee96e0f45395d)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - pass subscriber name

- [#394](https://github.com/badass-courses/course-builder/pull/394)
  [`0870b47`](https://github.com/badass-courses/course-builder/commit/0870b47402a95ccf7fdc216b10f3f0cd5c998b2d)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - pass down workflow id
  from resource-chat

## 1.0.0

### Major Changes

- [#320](https://github.com/badass-courses/course-builder/pull/320)
  [`d6caa19`](https://github.com/badass-courses/course-builder/commit/d6caa19626edc5424c39fca90b293311d852cc12)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds organizations for
  multi-tenant

## 0.2.4

### Patch Changes

- [#315](https://github.com/badass-courses/course-builder/pull/315)
  [`2180c88`](https://github.com/badass-courses/course-builder/commit/2180c8887041cbe99bdbdcf37e391c5183644c0c)
  Thanks [@joelhooks](https://github.com/joelhooks)! - update to next 15 and
  react 19 😭

- Updated dependencies
  [[`2180c88`](https://github.com/badass-courses/course-builder/commit/2180c8887041cbe99bdbdcf37e391c5183644c0c)]:
  - @coursebuilder/email-templates@1.0.4

## 0.2.3

### Patch Changes

- [#247](https://github.com/badass-courses/course-builder/pull/247)
  [`25f1e5e`](https://github.com/badass-courses/course-builder/commit/25f1e5efc39524d27172f8cce4902cbacc11c2a4)
  Thanks [@joelhooks](https://github.com/joelhooks)! - removes legacy
  bulkPurchaseId column from coupon table

- [#288](https://github.com/badass-courses/course-builder/pull/288)
  [`cc4cc87`](https://github.com/badass-courses/course-builder/commit/cc4cc87c1ae0425c80c5ab5918c62a348aa47941)
  Thanks [@joelhooks](https://github.com/joelhooks)! - various changes for
  ProNextJS etc release

- [#243](https://github.com/badass-courses/course-builder/pull/243)
  [`e1e94e2`](https://github.com/badass-courses/course-builder/commit/e1e94e24375af37b6e7c51d698a0131d268a7f66)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds a coursebuilder
  email list provider

- [#240](https://github.com/badass-courses/course-builder/pull/240)
  [`764437e`](https://github.com/badass-courses/course-builder/commit/764437e71a1aebec3db81acf2d67d28fbfee8146)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - create purchases
  endpoint

- [`624e04a`](https://github.com/badass-courses/course-builder/commit/624e04aa830cdbc7bedc302466363aa1a3831cea)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - implement
  getProductResources handler

- [#235](https://github.com/badass-courses/course-builder/pull/235)
  [`bccc308`](https://github.com/badass-courses/course-builder/commit/bccc3084077ab2bf24f1ac9361c3c13936749c6a)
  Thanks [@joelhooks](https://github.com/joelhooks)! - improved progress loading
  for module

- [#245](https://github.com/badass-courses/course-builder/pull/245)
  [`5bfac50`](https://github.com/badass-courses/course-builder/commit/5bfac5047ccc81f563d53a4b7780fcf14edf2bf8)
  Thanks [@joelhooks](https://github.com/joelhooks)! - properly identify bulk
  purchases

- [#219](https://github.com/badass-courses/course-builder/pull/219)
  [`e32549a`](https://github.com/badass-courses/course-builder/commit/e32549ab4f0e903a467120a35ab27ef44892b115)
  Thanks [@joelhooks](https://github.com/joelhooks)! - removeResourceResource so
  content resources can be detached from parent

- [#206](https://github.com/badass-courses/course-builder/pull/206)
  [`b138ba5`](https://github.com/badass-courses/course-builder/commit/b138ba58a22623ca9bdbe9529e054d10d6014881)
  Thanks [@joelhooks](https://github.com/joelhooks)! - tweaks for commerce

- [#221](https://github.com/badass-courses/course-builder/pull/221)
  [`a5ff185`](https://github.com/badass-courses/course-builder/commit/a5ff1856f912badecea337b014df525b950badc1)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - update
  redeemFullPriceCoupon method to return useful error message when trying to
  redeem existing purchase

- Updated dependencies
  [[`e1e94e2`](https://github.com/badass-courses/course-builder/commit/e1e94e24375af37b6e7c51d698a0131d268a7f66)]:
  - @coursebuilder/email-templates@1.0.3

## 0.2.2

### Patch Changes

- [#183](https://github.com/badass-courses/course-builder/pull/183)
  [`9421c4f`](https://github.com/badass-courses/course-builder/commit/9421c4f1db7eb84728abca79bf68acb0b5ee2671)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds a state machine to
  pricing component

- [`1dd4a5b`](https://github.com/badass-courses/course-builder/commit/1dd4a5bbd2b737ab45431256139134d56c0686ec)
  Thanks [@joelhooks](https://github.com/joelhooks)! - fixes some cookie issues
  that we need for email list support

## 0.2.1

### Patch Changes

- [#176](https://github.com/badass-courses/course-builder/pull/176)
  [`a939e2b`](https://github.com/badass-courses/course-builder/commit/a939e2baa850a54167c800f83ba32030d6b6da4b)
  Thanks [@joelhooks](https://github.com/joelhooks)! - commerce functionality
  for ProAWS

- [#177](https://github.com/badass-courses/course-builder/pull/177)
  [`2d2be35`](https://github.com/badass-courses/course-builder/commit/2d2be35b50bdce90e111338dd788cb856c952e49)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adding events as products
  to proaws

## 0.2.0

### Minor Changes

- [`7ae7363`](https://github.com/badass-courses/course-builder/commit/7ae7363f3655fb123bc28b4cd2f249e9d082fec3)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - updates module progress
  getter

### Patch Changes

- [#168](https://github.com/badass-courses/course-builder/pull/168)
  [`9d900b2`](https://github.com/badass-courses/course-builder/commit/9d900b217a8d8ee1fdee1a9e0ae24b58e87773cc)
  Thanks [@joelhooks](https://github.com/joelhooks)! - updates features of the
  pricing grid and lookup

- [#170](https://github.com/badass-courses/course-builder/pull/170)
  [`22c290a`](https://github.com/badass-courses/course-builder/commit/22c290ad7eec68e664c0027ba9389af41c71a16a)
  Thanks [@joelhooks](https://github.com/joelhooks)! - enables purchase
  transfers end to end

- [#171](https://github.com/badass-courses/course-builder/pull/171)
  [`78d8536`](https://github.com/badass-courses/course-builder/commit/78d8536c4944ab1f98a6376ad9dcc8baac9fc2ff)
  Thanks [@joelhooks](https://github.com/joelhooks)! - enables coupon redemption
  for 100% of "golden tickets"

- Updated dependencies
  [[`22c290a`](https://github.com/badass-courses/course-builder/commit/22c290ad7eec68e664c0027ba9389af41c71a16a)]:
  - @coursebuilder/email-templates@1.0.2

## 0.1.5

### Patch Changes

- [#161](https://github.com/badass-courses/course-builder/pull/161)
  [`acce952`](https://github.com/badass-courses/course-builder/commit/acce95260e808a74b94c81c165ff296c014d27ff)
  Thanks [@joelhooks](https://github.com/joelhooks)! - product crud ui and
  roundtrip to stripe for updates

- [#166](https://github.com/badass-courses/course-builder/pull/166)
  [`8671173`](https://github.com/badass-courses/course-builder/commit/8671173c90e581a7682eecce894d9dcb897e3cce)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds the ability to add
  content resources to a product

- [#167](https://github.com/badass-courses/course-builder/pull/167)
  [`39b0ef5`](https://github.com/badass-courses/course-builder/commit/39b0ef5e4556ee1a1fd549f3bc48f405fe8b6984)
  Thanks [@joelhooks](https://github.com/joelhooks)! - redemptions and purchase
  recording with an email at the end

- [#156](https://github.com/badass-courses/course-builder/pull/156)
  [`18169be`](https://github.com/badass-courses/course-builder/commit/18169be84613cac1cc2d35bc6cd386eaf803f53f)
  Thanks [@joelhooks](https://github.com/joelhooks)! - migrates commerce flows
  from Skill Stack into Course Builder

- Updated dependencies
  [[`39b0ef5`](https://github.com/badass-courses/course-builder/commit/39b0ef5e4556ee1a1fd549f3bc48f405fe8b6984)]:
  - @coursebuilder/email-templates@1.0.1

## 0.1.4

### Patch Changes

- [`f949262`](https://github.com/badass-courses/course-builder/commit/f9492620ffc94d5de28dff3b7fd3ee38ca06869d)
  Thanks [@joelhooks](https://github.com/joelhooks)! - fix the dang inngest
  event size

## 0.1.3

### Patch Changes

- [#148](https://github.com/badass-courses/course-builder/pull/148)
  [`8e5d28e`](https://github.com/badass-courses/course-builder/commit/8e5d28eb27c3c4fc6f181c4d1e118aa23828c0c4)
  Thanks [@joelhooks](https://github.com/joelhooks)! - general cleanup

## 0.1.2

### Patch Changes

- [#146](https://github.com/badass-courses/course-builder/pull/146)
  [`c56c4f9`](https://github.com/badass-courses/course-builder/commit/c56c4f98836b5869b3af575ec3e55db08ca45c21)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds a partykit provider
  to core

## 0.1.1

### Patch Changes

- [#144](https://github.com/badass-courses/course-builder/pull/144)
  [`2b1ee5b`](https://github.com/badass-courses/course-builder/commit/2b1ee5bfddc417f5f8112f297e03b4ad8d281aa0)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds LLM provider
  (openai) to core

## 0.1.0

### Minor Changes

- [#139](https://github.com/badass-courses/course-builder/pull/139)
  [`7e422eb`](https://github.com/badass-courses/course-builder/commit/7e422eb3f19aa99f465f444e4180635dac5baa50)
  Thanks [@joelhooks](https://github.com/joelhooks)! - starts the process for
  migrating the `prisma-api` from Skill Stack

## 0.0.10

### Patch Changes

- [`ae2c34a`](https://github.com/badass-courses/course-builder/commit/ae2c34a8619dd4cd892bc8b2c99af3d67e9da8e7)
  Thanks [@joelhooks](https://github.com/joelhooks)! - remove rate limit from
  video upload event in inngest

## 0.0.9

### Patch Changes

- [#126](https://github.com/badass-courses/course-builder/pull/126)
  [`0b590f9`](https://github.com/badass-courses/course-builder/commit/0b590f984b038d951fc2bceb243415e0cf49ce20)
  Thanks [@joelhooks](https://github.com/joelhooks)! - updates next-auth and
  auth-core and gives a "session" to coursebuilder

## 0.0.8

### Patch Changes

- [#124](https://github.com/badass-courses/course-builder/pull/124)
  [`25df89a`](https://github.com/badass-courses/course-builder/commit/25df89a0524e8c340bbd4898fa369df3c9e2b720)
  Thanks [@joelhooks](https://github.com/joelhooks)! - integrates vitest for
  testing core and adapter-drizzle

## 0.0.7

### Patch Changes

- [`9402139f9ded1656c68daec0a422fa640f34748e`](https://github.com/badass-courses/course-builder/commit/9402139f9ded1656c68daec0a422fa640f34748e)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adapter-drizzle now
  exports schemas

## 0.0.6

### Patch Changes

- [#117](https://github.com/badass-courses/course-builder/pull/117)
  [`e3a2ffba66ca708f9e8982d05a6d827afe57970a`](https://github.com/badass-courses/course-builder/commit/e3a2ffba66ca708f9e8982d05a6d827afe57970a)
  Thanks [@joelhooks](https://github.com/joelhooks)! - moves the video
  processing fucntions BACK to core but with a schema to keep type safety and
  shared context in core and consumer apps

## 0.0.5

### Patch Changes

- [#115](https://github.com/badass-courses/course-builder/pull/115)
  [`931b6d1c482df050eb3840f518b73e4e3204ab53`](https://github.com/badass-courses/course-builder/commit/931b6d1c482df050eb3840f518b73e4e3204ab53)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds the ability to
  create a tutorial collection, which is a flat playlist (no sections yet)

## 0.0.4

### Patch Changes

- [#113](https://github.com/badass-courses/course-builder/pull/113)
  [`c22006c720e7ab149ec43783aa0e3b590f92ab47`](https://github.com/badass-courses/course-builder/commit/c22006c720e7ab149ec43783aa0e3b590f92ab47)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds the ability to
  create a tutorial collection, which is a flat playlist (no sections yet)

## 0.0.3

### Patch Changes

- [#107](https://github.com/badass-courses/course-builder/pull/107)
  [`cc3885f3502e72873213a2fbccd58b684b653747`](https://github.com/badass-courses/course-builder/commit/cc3885f3502e72873213a2fbccd58b684b653747)
  Thanks [@joelhooks](https://github.com/joelhooks)! - migrates all video
  processing workflows into `core` for both inngest and database adapter

## 0.0.2

### Patch Changes

- [#104](https://github.com/badass-courses/course-builder/pull/104)
  [`2def195558d69b00ce6c1001781215c97488a99b`](https://github.com/badass-courses/course-builder/commit/2def195558d69b00ce6c1001781215c97488a99b)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adding adapter and core
  packages to extend the pattern that is presented by authjs to include Course
  Builder `contentResource` schema

  this approach will allow us to maintain adapters for mysql, sqlite, and pg,
  potentially beyond drizzle if needed
