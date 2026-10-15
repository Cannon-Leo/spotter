---
description: Governs session management, device binding, PIN hashing, access logging, and check-in auth.
trigger: model_decision
globs:
  - "src/server/auth/**"
  - "src/server/private/**"
  - "app/api/auth/**"
  - "app/api/check-in/**"
---

# Auth and Sessions

This file governs `src/server/auth/session.ts`, `src/server/private/*.ts`, and check in.
 
## Activation and device binding
 
- An activation code is one time use, eight characters, shown once, and stored only as a hash. Reason: a stored plain code could be read and used by someone else.
- A code expires seventy two hours after issue or on first use, whichever comes first. The PRD marks seventy two hours as an assumption. Do not change it without asking. Reason: a code issued on Friday evening should still work on Sunday.
- There is no self service reset. Re linking a device always needs a fresh code from the desk. Never build a resend code flow, an SMS flow, or an email flow. Reason: SMS costs money per message and breaks the free tier rule, and the number was checked in person at signup.
- Staff may send a code to a member's registered WhatsApp number without the member attending. The limit is two remote re links per member per thirty days. Each one is logged with the issuing staff ID and the reason. A third within thirty days must be refused and needs the member at the desk. Reason: a remote code skips the in person check, so it needs a cap and a record.
- A PIN is stored only as a hash. The plain PIN is never stored, logged, or returned in an error. Reason: a PIN that appears in a log is a PIN that can be stolen from the log.
## Session and identity
 
- The member ID and effective tier for a request come only from the session cookie, read in `src/server/auth/session.ts`. Reason: a value read from a request body or a query parameter can be typed in by anyone, including a value that belongs to a different member.
- A member holds one active device at a time. Activating on a new device revokes the previous session immediately. Reason: an old session left alive on a lost or shared phone is a standing way for someone else to see that member's private data.
- A session lasts ninety days from last use and refreshes on each request. Reason: a member who opens the app now and then should not be logged out for no cause.
- The member must re enter her PIN after seven days of inactivity, and immediately before any payment. Reason: a phone left unlocked or shared should not be able to start a payment on an old session.
- Five wrong PIN entries in a row lock the account for fifteen minutes. Reason: a four digit PIN has only ten thousand combinations, so guessing must be slowed.
- Ten wrong PIN entries within twenty four hours revoke the session and need a fresh code from the desk. Reason: slow guessing spread across a day must still come to an end.
- Staff and owner sessions never share a cookie name, a session table, or middleware with the member session. Reason: a bug that mixes these together turns a staff login into a member session, or the reverse, which is a far larger failure than one member's data leaking.
- Staff see a member's attendance, effective tier, and expiry only. Staff never see any balance or payment history. The PRD marks this an assumption. Do not change it without asking. Reason: cash entry is the owner's control point, and hiding money from staff keeps that control clean.
## Private data reads
 
- Every function that reads a member's private record takes the member ID as its first argument, and that ID always comes from the session, never from the caller's request data. Reason: this lets the rule be enforced in one place instead of remembered separately in every route.
- Every private read writes a row to the access log, recording the session member ID, the member ID actually queried, and which function ran. Reason: a rule with no record of whether it held is a hope, not a control.
- Every day, every access log row from that day must show the same session member ID and queried member ID. Any mismatch is shown on the owner's review page as an incident. This file defines the check. `rules/payments.md` defines when it runs. Reason: this is the detector behind never showing one member another member's data, and detection only works if someone looks at it.
- Numbers in a private answer are rendered by application code from a fixed template. The language model only returns the intent and a date range. It never sees the rows. Reason: a model that never sees a figure cannot get one wrong.
- A member's balance is computed by one function only. It sums the amounts on that member's ledger entries, in SQL. A positive result means she owes. Payments, credits, and refunds are stored as negative amounts. Charges and opening balances are stored as positive amounts. Every balance display calls this one function. Never store a balance field, and never write a second definition of balance. Reason: two definitions of balance will eventually disagree, and a wrong balance is the failure this product cannot afford.
- Money is reported, never ruled on. The app renders "Our records show 15,000 naira outstanding for July." It never renders "You owe 15,000 naira." The amount and month are examples. The wording is a fixed template, not an instruction to the model. Reason: the app only knows what the gym has recorded, and a cash payment may not be entered yet, so it must state the records and not decide what she owes.
## Check in
 
- A check in is accepted only during the gym's stated opening hours. Outside those hours, it is refused regardless of whether the code typed is correct. Reason: a check in outside opening hours cannot be a real visit.
- Check in is blocked once a member's status has moved past grace into expired. The screen shows the renewal amount and the pay button instead of accepting the check in. Reason: a check in credits a visit the gym did not sell.
- The daily check in code is produced by a scheduled job that runs once a day and generates a new four digit code for staff to write on the board. Reason: a code that never changes gives away the same information forever to anyone who once saw the board.
- The owner review page flags a day where check ins exceed one hundred fifty percent of that weekday's trailing four week average, and flags any burst of more than ten check ins from different devices within sixty seconds. Reason: a shared or photographed code inflates the attendance count without a real extra visit happening, and this is the only way to catch that after the fact.