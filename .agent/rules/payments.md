---
description: Governs payment verification, idempotency, atomic settlement, immutable ledger, and nightly sweep.
trigger: model_decision
globs:
  - "src/server/payments/**"
  - "app/api/webhooks/payment/**"
  - "app/api/pay/**"
---

# Payments

This file governs payment processing. It applies whichever gateway is confirmed for this build; see the open item on gateway choice in AGENTS.md.
 
## Confirming a payment
 
- Only a verified webhook call from the payment gateway may mark a payment successful. A browser redirect back to the app is a hint that a payment might have gone through, never proof. Reason: a redirect can fail to fire even when the payment succeeded, or fire without a real payment behind it, and either way it is not something the gateway itself confirmed.
- The webhook's signature is checked before any database write happens, not after. Reason: an unverified webhook call is untrusted input, and untrusted input should never reach the database first.
- Marking a payment successful, creating the payment record, creating the ledger entry, and extending membership when the payment is a renewal all happen inside one database transaction. Reason: if any one of these fails, none of them should be left half done, because a payment recorded without the matching membership extension is exactly the mismatch this file exists to prevent.
## Idempotency
 
- Every payment attempt carries a unique idempotency key. A repeated attempt with the same key returns the existing attempt instead of creating a new charge. Reason: a member tapping pay twice, or a network retry firing twice, must never charge her twice.
- An attempt still marked pending is never treated as expired. Access holds for twenty four hours from the attempt. Reason: the payment may still be moving through the gateway even though nothing has confirmed yet, and locking the member out during that window punishes her for the gateway's own delay.
- An attempt still pending after twenty four hours is marked abandoned by the nightly sweep and shown on the owner's review page. It is never marked failed without the gateway explicitly confirming failure. Reason: the money may still have moved even though the app never heard back, and marking it failed wrongly could let staff disregard a payment that actually went through.
## Renewal
 
- On a confirmed renewal payment, the expiry date is extended by the plan's duration, counted from whichever is later, today or the current expiry date. No staff action is required and none is waited for. Reason: a renewal slower than walking to the desk and paying cash defeats the reason this feature exists.
- Every change to a member's expiry date is recorded with the old value, the new value, and the payment reference as the reason. Reason: a disputed renewal needs a paper trail, not a single current number with no history behind it.
- A cash or transfer payment that staff record as a renewal follows this exact same extension rule. Reason: a member who pays at the desk should not be renewed by a different, possibly inconsistent, set of logic than a member who pays in the app.
- A payment amount always comes from the membership plan stored in the database, never by reading or parsing the text of a prices card. Reason: a prices card is written for a person to read, and parsing prose to pull out a number is a source of silent errors a structured record does not have.
## Recording cash and transfers
 
- A cash or transfer payment must be entered by staff on the same calendar day it is received. Reason: a balance the app states is only as good as how current the underlying entry is, and a payment entered days late means the app gave a wrong answer for those days.
- Balance answers do not go live until fourteen consecutive days show same day entry, measured as the gap between when a payment was received and when it was recorded. Until that gate is met, the app answers attendance questions only, never balance questions. Reason: launching a balance feature on a habit that has not actually formed yet guarantees the feature starts by being wrong.
## Corrections and immutability
 
- An in app payment can never be edited or deleted by anyone, including the owner. Reason: an editable financial record is not evidence of anything.
- A cash or transfer payment and its ledger entry can never be deleted. Reason: a deleted entry leaves a gap no one can explain later.
- Fix a mistake with an offsetting ADJUSTMENT entry that stays visible. Never edit or delete the wrong entry. Reason: a visible correction keeps the full history, and a rewritten entry hides that anything went wrong.
## The nightly sweep
 
One scheduled job, run once a day, does three things:
 
1. Marks any payment attempt pending over twenty four hours as abandoned.
2. Runs the access log check defined in `rules/auth-and-sessions.md`.
3. Computes the counts shown on the owner's weekly review page.
Reason these three are combined: the hosting plan for this build allows only two scheduled jobs in total, so these checks share the one job that is not the daily check in code job.