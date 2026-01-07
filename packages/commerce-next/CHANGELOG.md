# @coursebuilder/commerce-next

## 0.1.0

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

- [#579](https://github.com/badass-courses/course-builder/pull/579)
  [`5d94d4e`](https://github.com/badass-courses/course-builder/commit/5d94d4e4b634f612228dfa2c081fc96f201d85cc)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - upgrade next to beta,
  update related deps (react, react-dom, eslint, etc)

- [#588](https://github.com/badass-courses/course-builder/pull/588)
  [`43405a9`](https://github.com/badass-courses/course-builder/commit/43405a9d232d97234e671fe951472318c19632de)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bump mux

- [#620](https://github.com/badass-courses/course-builder/pull/620)
  [`c0b1cdd`](https://github.com/badass-courses/course-builder/commit/c0b1cddd8a67ee67ce21732e92d4d0032c7b0ede)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - ability to modify
  invoice name

- [#600](https://github.com/badass-courses/course-builder/pull/600)
  [`1660ec0`](https://github.com/badass-courses/course-builder/commit/1660ec01100dbc5206136812c3085e9de34ea9ed)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - use client in pricing
  root

- [`9a1d398`](https://github.com/badass-courses/course-builder/commit/9a1d398b6471b4a17764a5c8bbe6648926fd8014)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - style tweaks

- [#595](https://github.com/badass-courses/course-builder/pull/595)
  [`e58242e`](https://github.com/badass-courses/course-builder/commit/e58242e00dfec12119194d197f81b5573960227a)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bump mux player

- [#589](https://github.com/badass-courses/course-builder/pull/589)
  [`f8dffc9`](https://github.com/badass-courses/course-builder/commit/f8dffc989c2636c25395701cfa949dfcb3ffd27b)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bump next from beta to
  stable

- [#596](https://github.com/badass-courses/course-builder/pull/596)
  [`896c68c`](https://github.com/badass-courses/course-builder/commit/896c68cf12b07e77c534e89cf0b1741776fa64ce)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add QuestionResponses
  table

- [`79764de`](https://github.com/badass-courses/course-builder/commit/79764deb0346fca813e01d2e2409712990990d8e)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - dont require
  verify-login redirect

- [`78595ef`](https://github.com/badass-courses/course-builder/commit/78595ef4363f034b765cf18b78e5583cb6161782)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bump mux player

- [`8267b98`](https://github.com/badass-courses/course-builder/commit/8267b984c6167c12bef8315900764943d0d86087)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - chore: make sure
  availableCoupons is array

- [#628](https://github.com/badass-courses/course-builder/pull/628)
  [`f064fbc`](https://github.com/badass-courses/course-builder/commit/f064fbc4c6cb40d9746b8ad0670668869c990be4)
  Thanks [@zacjones93](https://github.com/zacjones93)! - fix: upgrade next peer
  dependency to 16.0.7 to resolve type incompatibilities

- Updated dependencies
  [[`fff302b`](https://github.com/badass-courses/course-builder/commit/fff302b9a483f8d9b6209bf5ec3fa57830c3e8e9),
  [`5d94d4e`](https://github.com/badass-courses/course-builder/commit/5d94d4e4b634f612228dfa2c081fc96f201d85cc),
  [`1b92a3a`](https://github.com/badass-courses/course-builder/commit/1b92a3ac602291f219370fb264d8e0099f54963c),
  [`f11c60f`](https://github.com/badass-courses/course-builder/commit/f11c60f9b08d7955ea840af15cc0d14d7c44f633),
  [`43405a9`](https://github.com/badass-courses/course-builder/commit/43405a9d232d97234e671fe951472318c19632de),
  [`4134b05`](https://github.com/badass-courses/course-builder/commit/4134b05115972b2d6edae4ae4ae8a7a2b10557f3),
  [`18d2d04`](https://github.com/badass-courses/course-builder/commit/18d2d048e0e1083d66f5c929ffedf5452b9f93ef),
  [`14a6804`](https://github.com/badass-courses/course-builder/commit/14a68045e0051ce54fb129ff5bce37a371788f3d),
  [`a4dce03`](https://github.com/badass-courses/course-builder/commit/a4dce03ce7e954653d423dd48c66e15c0bd23e4e),
  [`f32a708`](https://github.com/badass-courses/course-builder/commit/f32a7080d405ca4ffc81d0e36d05d675dbc17844),
  [`9a1d398`](https://github.com/badass-courses/course-builder/commit/9a1d398b6471b4a17764a5c8bbe6648926fd8014),
  [`e58242e`](https://github.com/badass-courses/course-builder/commit/e58242e00dfec12119194d197f81b5573960227a),
  [`9368a4c`](https://github.com/badass-courses/course-builder/commit/9368a4cf68b5ca069856b3e97012045af5954aef),
  [`896c68c`](https://github.com/badass-courses/course-builder/commit/896c68cf12b07e77c534e89cf0b1741776fa64ce),
  [`79764de`](https://github.com/badass-courses/course-builder/commit/79764deb0346fca813e01d2e2409712990990d8e),
  [`22fe75f`](https://github.com/badass-courses/course-builder/commit/22fe75f78d801e1c053cd6b938a6f376f8eaa147),
  [`78595ef`](https://github.com/badass-courses/course-builder/commit/78595ef4363f034b765cf18b78e5583cb6161782),
  [`a2a97ca`](https://github.com/badass-courses/course-builder/commit/a2a97ca5a411be88db9468e01256fd59096155f9),
  [`b2fd748`](https://github.com/badass-courses/course-builder/commit/b2fd7486d47dfc63dfc16e5af48b298bbbcc56a5),
  [`8267b98`](https://github.com/badass-courses/course-builder/commit/8267b984c6167c12bef8315900764943d0d86087),
  [`942042c`](https://github.com/badass-courses/course-builder/commit/942042c0ea02354d0d59db4bc9ceb073993f6f0c),
  [`06a993f`](https://github.com/badass-courses/course-builder/commit/06a993f15df98235a8df9b816cb351aaab2dc202)]:
  - @coursebuilder/core@1.1.0
  - @coursebuilder/email-templates@1.0.7
  - @coursebuilder/ui@2.0.8
  - @coursebuilder/nodash@0.0.2

## 0.0.14

### Patch Changes

- [#516](https://github.com/badass-courses/course-builder/pull/516)
  [`83e1ff4`](https://github.com/badass-courses/course-builder/commit/83e1ff4e5960bb9897c2444a2424026cd1ed903c)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - upgrade tailwind to v4

- [#534](https://github.com/badass-courses/course-builder/pull/534)
  [`a62e812`](https://github.com/badass-courses/course-builder/commit/a62e812c365c6060acce6914a2bf8019bcff5a4f)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bumps next version

- Updated dependencies
  [[`83e1ff4`](https://github.com/badass-courses/course-builder/commit/83e1ff4e5960bb9897c2444a2424026cd1ed903c),
  [`b2ac781`](https://github.com/badass-courses/course-builder/commit/b2ac781b15ec695d40c87bbef29fd21c9a9593c4),
  [`e6e5e59`](https://github.com/badass-courses/course-builder/commit/e6e5e5924fa540e6f4d88dec408a68c7e50725a9),
  [`8f4bb1c`](https://github.com/badass-courses/course-builder/commit/8f4bb1c0cee7296841f40564f43910ccf743752b),
  [`a62e812`](https://github.com/badass-courses/course-builder/commit/a62e812c365c6060acce6914a2bf8019bcff5a4f)]:
  - @coursebuilder/ui@2.0.7
  - @coursebuilder/core@1.0.6
  - @coursebuilder/email-templates@1.0.6

## 0.0.13

### Patch Changes

- [`cfa869c`](https://github.com/badass-courses/course-builder/commit/cfa869c18791f7c742a2f48b0b6c4e2664846251)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - remove balancer
  component in product name

- [`9769874`](https://github.com/badass-courses/course-builder/commit/9769874a8acd0c21e317674b3cfb68d16602c219)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - sold out label

- [`3eb7362`](https://github.com/badass-courses/course-builder/commit/3eb7362c53d5589138e657423d1d43390c16bd15)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add cohort link

- [`639af6d`](https://github.com/badass-courses/course-builder/commit/639af6d499410198e322df38a74b4fa8ec8310df)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - update sold out
  handling in pricing widget and team toggle, improve waitlist styling

- [`a34b701`](https://github.com/badass-courses/course-builder/commit/a34b701f70d9ba66d7c291f51db8e63ff81c660a)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add ability to init
  product with a type, fix waitlist logic

- Updated dependencies
  [[`ed6b124`](https://github.com/badass-courses/course-builder/commit/ed6b1246b35b40f30cdf27b5507407c26d310424),
  [`b1907df`](https://github.com/badass-courses/course-builder/commit/b1907dfdebc4f7bca7ede2532695c0375b437ebe),
  [`aa77733`](https://github.com/badass-courses/course-builder/commit/aa77733d0965710f849be83cffe7374ad3e1edf3),
  [`60e8113`](https://github.com/badass-courses/course-builder/commit/60e811310faab346e385669c9a4ef5a25849ce07),
  [`c40a50c`](https://github.com/badass-courses/course-builder/commit/c40a50c1e4244e2881eed47a0903a5243222f1cf),
  [`8096127`](https://github.com/badass-courses/course-builder/commit/8096127e361879f5ef768c74d95fd8aef85bfbac),
  [`4e29da7`](https://github.com/badass-courses/course-builder/commit/4e29da74a433635089bb2796abbe1339fd8f4dbd),
  [`639af6d`](https://github.com/badass-courses/course-builder/commit/639af6d499410198e322df38a74b4fa8ec8310df),
  [`1edb931`](https://github.com/badass-courses/course-builder/commit/1edb9318a1af4869e1685606bf4dae9da5dfb031),
  [`a34b701`](https://github.com/badass-courses/course-builder/commit/a34b701f70d9ba66d7c291f51db8e63ff81c660a)]:
  - @coursebuilder/core@1.0.5
  - @coursebuilder/ui@2.0.6

## 0.0.12

### Patch Changes

- [#450](https://github.com/badass-courses/course-builder/pull/450)
  [`355cb64`](https://github.com/badass-courses/course-builder/commit/355cb64a678034fa02f96a05adc469276ab673ac)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - tweak welcome message
  by type

- [`75dedab`](https://github.com/badass-courses/course-builder/commit/75dedabbdb956a1b968a7fe94d3ab7f6af9d1cc0)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - sold out event with
  coupon can still be bought

- [#460](https://github.com/badass-courses/course-builder/pull/460)
  [`7a10553`](https://github.com/badass-courses/course-builder/commit/7a105531deaca25b27108ee4308d97900dc154e2)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - pass usedCoupon to
  formattedPricing

- [#450](https://github.com/badass-courses/course-builder/pull/450)
  [`355cb64`](https://github.com/badass-courses/course-builder/commit/355cb64a678034fa02f96a05adc469276ab673ac)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - remove console log

- [#455](https://github.com/badass-courses/course-builder/pull/455)
  [`25e2fde`](https://github.com/badass-courses/course-builder/commit/25e2fde7ee902569728e9f936298126c72efb9ae)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - add waitlist component

- Updated dependencies
  [[`08b5baf`](https://github.com/badass-courses/course-builder/commit/08b5baf69d334a360db177154e347122be4e6ad1),
  [`0b7589f`](https://github.com/badass-courses/course-builder/commit/0b7589f74d25507795343b90026ff7f8f13becb4),
  [`4a7a143`](https://github.com/badass-courses/course-builder/commit/4a7a1432b5b3c97d730115178d2c3938e15cb7ab),
  [`7a10553`](https://github.com/badass-courses/course-builder/commit/7a105531deaca25b27108ee4308d97900dc154e2),
  [`3806be5`](https://github.com/badass-courses/course-builder/commit/3806be5e893ce6418a8157976da0747a438680c3),
  [`af9b3af`](https://github.com/badass-courses/course-builder/commit/af9b3af0b42f3248dc442a089616005eeaef8ecc),
  [`596b298`](https://github.com/badass-courses/course-builder/commit/596b2980a8485adc2bc5331b527d47b89c095776)]:
  - @coursebuilder/core@1.0.4
  - @coursebuilder/ui@2.0.5
  - @coursebuilder/email-templates@1.0.5

## 0.0.11

### Patch Changes

- [#387](https://github.com/badass-courses/course-builder/pull/387)
  [`b4a7856`](https://github.com/badass-courses/course-builder/commit/b4a785689b12c89be317f10b013aed21f445f8f2)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bump next

- Updated dependencies
  [[`c6eda5e`](https://github.com/badass-courses/course-builder/commit/c6eda5e2fd9159146c8bb35620dee96e0f45395d),
  [`24e1eae`](https://github.com/badass-courses/course-builder/commit/24e1eae80e189bb58644cb8e94b2143293ad5142),
  [`9cacf5d`](https://github.com/badass-courses/course-builder/commit/9cacf5d3901799cc0dff55766af48d611d4fc821),
  [`63a204b`](https://github.com/badass-courses/course-builder/commit/63a204ba5232c0dadaf2072e5c64e6716c56614c),
  [`0870b47`](https://github.com/badass-courses/course-builder/commit/0870b47402a95ccf7fdc216b10f3f0cd5c998b2d)]:
  - @coursebuilder/core@1.0.1
  - @coursebuilder/ui@2.0.2

## 0.0.10

### Patch Changes

- [#374](https://github.com/badass-courses/course-builder/pull/374)
  [`ac0fb09`](https://github.com/badass-courses/course-builder/commit/ac0fb09591e1a953d1d22a626df1217627401d69)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - bump next

- Updated dependencies
  [[`ac0fb09`](https://github.com/badass-courses/course-builder/commit/ac0fb09591e1a953d1d22a626df1217627401d69)]:
  - @coursebuilder/ui@2.0.1

## 0.0.9

### Patch Changes

- Updated dependencies
  [[`d6caa19`](https://github.com/badass-courses/course-builder/commit/d6caa19626edc5424c39fca90b293311d852cc12)]:
  - @coursebuilder/core@1.0.0
  - @coursebuilder/ui@2.0.0

## 0.0.8

### Patch Changes

- [#315](https://github.com/badass-courses/course-builder/pull/315)
  [`2180c88`](https://github.com/badass-courses/course-builder/commit/2180c8887041cbe99bdbdcf37e391c5183644c0c)
  Thanks [@joelhooks](https://github.com/joelhooks)! - update to next 15 and
  react 19 😭

- Updated dependencies
  [[`2180c88`](https://github.com/badass-courses/course-builder/commit/2180c8887041cbe99bdbdcf37e391c5183644c0c)]:
  - @coursebuilder/email-templates@1.0.4
  - @coursebuilder/core@0.2.4
  - @coursebuilder/ui@1.0.17

## 0.0.7

### Patch Changes

- [#247](https://github.com/badass-courses/course-builder/pull/247)
  [`25f1e5e`](https://github.com/badass-courses/course-builder/commit/25f1e5efc39524d27172f8cce4902cbacc11c2a4)
  Thanks [@joelhooks](https://github.com/joelhooks)! - removes legacy
  bulkPurchaseId column from coupon table

- [#243](https://github.com/badass-courses/course-builder/pull/243)
  [`e1e94e2`](https://github.com/badass-courses/course-builder/commit/e1e94e24375af37b6e7c51d698a0131d268a7f66)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds a coursebuilder
  email list provider

- [#225](https://github.com/badass-courses/course-builder/pull/225)
  [`b017d39`](https://github.com/badass-courses/course-builder/commit/b017d39fd161c9b88eb1de61c029f9a82033699e)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - use shared Checkbox
  component for PPP toggle

- [`624e04a`](https://github.com/badass-courses/course-builder/commit/624e04aa830cdbc7bedc302466363aa1a3831cea)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - fix "Start Learning" on
  Welcome page; redirect logged in users with email matching the purchase from
  Thanks to Welcome page

- [#248](https://github.com/badass-courses/course-builder/pull/248)
  [`b685ecb`](https://github.com/badass-courses/course-builder/commit/b685ecbb07ef37dcaf63136fd6202d56514f4dc9)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - correctly return
  redeemedBulkCouponPurchases

- [#216](https://github.com/badass-courses/course-builder/pull/216)
  [`c456113`](https://github.com/badass-courses/course-builder/commit/c456113d1bfcffa63fc710e71177708a8e7652ee)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - get country in
  propsForCommerce

- [#245](https://github.com/badass-courses/course-builder/pull/245)
  [`5bfac50`](https://github.com/badass-courses/course-builder/commit/5bfac5047ccc81f563d53a4b7780fcf14edf2bf8)
  Thanks [@joelhooks](https://github.com/joelhooks)! - properly identify bulk
  purchases

- [`50c92c4`](https://github.com/badass-courses/course-builder/commit/50c92c4b406198d7162a7800c4274c95be2af442)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - respect
  teamQuantityLimit in input

- [#221](https://github.com/badass-courses/course-builder/pull/221)
  [`a5ff185`](https://github.com/badass-courses/course-builder/commit/a5ff1856f912badecea337b014df525b950badc1)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - fix and refactor redeem
  dialog; improved team invite comps

- [#206](https://github.com/badass-courses/course-builder/pull/206)
  [`b138ba5`](https://github.com/badass-courses/course-builder/commit/b138ba58a22623ca9bdbe9529e054d10d6014881)
  Thanks [@joelhooks](https://github.com/joelhooks)! - tweaks for commerce

- [`c3b8e4e`](https://github.com/badass-courses/course-builder/commit/c3b8e4ea116a3a3b3b831c26b8dea267be24fd65)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - minor styling
  adjustments for team stuff

- [`78b81db`](https://github.com/badass-courses/course-builder/commit/78b81db908a68ebaa879596c423f7c9ebcdcf790)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - tweak countdown styles

- [#240](https://github.com/badass-courses/course-builder/pull/240)
  [`764437e`](https://github.com/badass-courses/course-builder/commit/764437e71a1aebec3db81acf2d67d28fbfee8146)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - create Purchased
  wrapper component and BuyMoreSeats components

- [`2a9943a`](https://github.com/badass-courses/course-builder/commit/2a9943a3f7936c7248749c4dd010932c893bde99)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - improved purchase
  transfer ux, fix logic for displaying "start learning" button

- Updated dependencies
  [[`d22e4bf`](https://github.com/badass-courses/course-builder/commit/d22e4bf1bff80c7b47b7f9d30b3610a4788adc75),
  [`25f1e5e`](https://github.com/badass-courses/course-builder/commit/25f1e5efc39524d27172f8cce4902cbacc11c2a4),
  [`cc4cc87`](https://github.com/badass-courses/course-builder/commit/cc4cc87c1ae0425c80c5ab5918c62a348aa47941),
  [`e1e94e2`](https://github.com/badass-courses/course-builder/commit/e1e94e24375af37b6e7c51d698a0131d268a7f66),
  [`a0831d3`](https://github.com/badass-courses/course-builder/commit/a0831d3f0381ef7e3c032f2e5215d6fecf7d384f),
  [`764437e`](https://github.com/badass-courses/course-builder/commit/764437e71a1aebec3db81acf2d67d28fbfee8146),
  [`624e04a`](https://github.com/badass-courses/course-builder/commit/624e04aa830cdbc7bedc302466363aa1a3831cea),
  [`bccc308`](https://github.com/badass-courses/course-builder/commit/bccc3084077ab2bf24f1ac9361c3c13936749c6a),
  [`5bfac50`](https://github.com/badass-courses/course-builder/commit/5bfac5047ccc81f563d53a4b7780fcf14edf2bf8),
  [`e32549a`](https://github.com/badass-courses/course-builder/commit/e32549ab4f0e903a467120a35ab27ef44892b115),
  [`9382a6f`](https://github.com/badass-courses/course-builder/commit/9382a6f62fd5c4a3e848979595091b7e00d9cd1b),
  [`b138ba5`](https://github.com/badass-courses/course-builder/commit/b138ba58a22623ca9bdbe9529e054d10d6014881),
  [`c0160a2`](https://github.com/badass-courses/course-builder/commit/c0160a2126f9db27340a3739018cbd67fbd643ca),
  [`a5ff185`](https://github.com/badass-courses/course-builder/commit/a5ff1856f912badecea337b014df525b950badc1)]:
  - @coursebuilder/ui@1.0.16
  - @coursebuilder/core@0.2.3
  - @coursebuilder/email-templates@1.0.3

## 0.0.6

### Patch Changes

- [#183](https://github.com/badass-courses/course-builder/pull/183)
  [`9421c4f`](https://github.com/badass-courses/course-builder/commit/9421c4f1db7eb84728abca79bf68acb0b5ee2671)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adds a state machine to
  pricing component

- Updated dependencies
  [[`9421c4f`](https://github.com/badass-courses/course-builder/commit/9421c4f1db7eb84728abca79bf68acb0b5ee2671),
  [`2e87fdd`](https://github.com/badass-courses/course-builder/commit/2e87fdd4397848939dbcc8cb7b0fae53267fdc62),
  [`1dd4a5b`](https://github.com/badass-courses/course-builder/commit/1dd4a5bbd2b737ab45431256139134d56c0686ec)]:
  - @coursebuilder/core@0.2.2
  - @coursebuilder/ui@1.0.14

## 0.0.5

### Patch Changes

- [`069cff0`](https://github.com/badass-courses/course-builder/commit/069cff0e5a194d8ab621cba331c16e8cab10a7f5)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - refactor
  thanks/purchase components

- [`b2d772a`](https://github.com/badass-courses/course-builder/commit/b2d772af7eca9d33b5fd5e7308be9c6ed39c5b18)
  Thanks [@joelhooks](https://github.com/joelhooks)! - small pricing refinements

- [`9a896da`](https://github.com/badass-courses/course-builder/commit/9a896dabfd5ee502e496caa4dbbcf5034c9f5d60)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - move invoice teaser
  under invoices

- [`ca88458`](https://github.com/badass-courses/course-builder/commit/ca88458593e6394767f8acd99ae95bf259ee97e3)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - refactor purchase
  transfer component and make it composable

- [`16428f9`](https://github.com/badass-courses/course-builder/commit/16428f904a08a1c4c26f360a0c44db51665cd9bb)
  Thanks [@vojtaholik](https://github.com/vojtaholik)! - style welcome page

- Updated dependencies
  [[`1715989`](https://github.com/badass-courses/course-builder/commit/1715989e41a46e4de3f7576c5bded88697157edb),
  [`d70f139`](https://github.com/badass-courses/course-builder/commit/d70f139ba8a77f745843b1e82ce9aa5f6e1d2607)]:
  - @coursebuilder/ui@1.0.13

## 0.0.4

### Patch Changes

- [#176](https://github.com/badass-courses/course-builder/pull/176)
  [`a939e2b`](https://github.com/badass-courses/course-builder/commit/a939e2baa850a54167c800f83ba32030d6b6da4b)
  Thanks [@joelhooks](https://github.com/joelhooks)! - commerce functionality
  for ProAWS

- [`cd702ae`](https://github.com/badass-courses/course-builder/commit/cd702aee9f4ef18a7225729e2cff22cef703d4e3)
  Thanks [@joelhooks](https://github.com/joelhooks)! - removes the barrel files
  from commerce

- [#177](https://github.com/badass-courses/course-builder/pull/177)
  [`2d2be35`](https://github.com/badass-courses/course-builder/commit/2d2be35b50bdce90e111338dd788cb856c952e49)
  Thanks [@joelhooks](https://github.com/joelhooks)! - adding events as products
  to proaws

- Updated dependencies
  [[`a939e2b`](https://github.com/badass-courses/course-builder/commit/a939e2baa850a54167c800f83ba32030d6b6da4b),
  [`2d2be35`](https://github.com/badass-courses/course-builder/commit/2d2be35b50bdce90e111338dd788cb856c952e49)]:
  - @coursebuilder/core@0.2.1
  - @coursebuilder/ui@1.0.12

## 0.0.3

### Patch Changes

- [#174](https://github.com/badass-courses/course-builder/pull/174)
  [`dc2049b`](https://github.com/badass-courses/course-builder/commit/dc2049b03393060136b41edc702ff2073fb2dd06)
  Thanks [@joelhooks](https://github.com/joelhooks)! - updates build so it works
  right for commerce-next

- Updated dependencies
  [[`7ae7363`](https://github.com/badass-courses/course-builder/commit/7ae7363f3655fb123bc28b4cd2f249e9d082fec3),
  [`9d900b2`](https://github.com/badass-courses/course-builder/commit/9d900b217a8d8ee1fdee1a9e0ae24b58e87773cc),
  [`22c290a`](https://github.com/badass-courses/course-builder/commit/22c290ad7eec68e664c0027ba9389af41c71a16a),
  [`78d8536`](https://github.com/badass-courses/course-builder/commit/78d8536c4944ab1f98a6376ad9dcc8baac9fc2ff)]:
  - @coursebuilder/core@0.2.0
  - @coursebuilder/email-templates@1.0.2
  - @coursebuilder/ui@1.0.11
