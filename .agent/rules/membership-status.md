---
description: Enforces derived membership status (active, in grace, expired, cancelled) and effective tier calculations.
trigger: model_decision
globs:
  - "src/server/membership/**"
  - "src/server/auth/**"
---

# Membership Status

This file governs how a member's status and tier are determined anywhere in the app.
 
- Membership status is never stored as a column. It is always computed by one function, `effectiveStatus(member, gym, now)`. Reason: a stored status can drift out of sync with the expiry date it is supposed to reflect, and a computed value cannot drift because there is nothing to fall out of sync.
- The possible values are active, in grace, expired, and cancelled. Reason: these are the only four states the rest of the app is allowed to reason about.
- Effective tier is computed by a second function, `effectiveTier(member, gym, now)`. It returns the member's stored tier while she is active or in grace, and drops to the lowest tier once she is expired or cancelled. Reason: a member who has not paid should not keep premium access just because no one flipped a flag.
- Only the effective tier, never the stored tier directly, may be passed into a search. Reason: passing the stored tier would let an expired member's search behave as if she still had premium access.
- No other function anywhere in the codebase computes status or tier independently. If a task needs either one, it calls these two functions. Reason: two independent implementations of the same rule will eventually disagree with each other, and neither will be obviously wrong when they do.
- Because status is derived, no scheduled job moves a member between states. Reason: a transition job is a second place this logic could fall out of sync with the first.
- The grace period length is stated in the PRD as three days but flagged there as unconfirmed. Treat it as unsettled. Ask before building anything whose behavior would change at a different grace length. Reason: building against an unconfirmed number now means rebuilding it later if the real number turns out to be different.
- An expired member keeps full access to her own history: past attendance, receipts, the timetable, the price list, and the pay button. Only new tier gated answers are affected. Reason: locking someone out of her own record, or out of the price list she needs to renew, works against getting her to pay again.