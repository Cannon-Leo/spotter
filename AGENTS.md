# Spotter

## Description

Spotter is a member facing web app for a single gym with four hundred members. It answers a member's questions using only the gym's own approved records, lets her check in, see her own attendance and balance, and pay her subscription, with a confirmed payment extending her membership right away and no staff action required. When the records hold no answer, or the question is on the never answer list, the app says so in one sentence and hands the member to the named front desk officer.

## Who uses it

- Member. The only user who opens the app itself. Asks questions, checks in, views her own attendance, expiry, and balance, and pays.
- Owner. Supplies records through a separate screen and never opens the member app. Approves cards, maintains the member list and membership plans, enters cash and transfer payments, and runs the weekly review and answer audit.
- Staff (two front desk officers). Supply records through a separate screen and never open the member app. Draft cards for approval, set the daily check in code, issue activation codes in person or remotely to a member's registered WhatsApp number within a stated per member limit with every remote issue logged, and record manual check ins. Appear inside the member app only as a name and a WhatsApp link when Spotter cannot answer.

## One thing the agent must do well

Keep every private answer scoped to the session member's own ID, and never let the app display a fact, a record, or a balance it cannot point to a source and a confirmation date for. This is checked, not just prevented, by a specific access log the PRD names (G-5, 8.5) and by the owner's weekly review (FR-49). Building that log correctly is part of the feature, not optional.

## Define the scope for the MVP

- Ask about the gym. Answers a question from approved shared cards allowed by the member's effective tier, with a report control on the answer. Every generated answer passes a grounding check against its source chunks before it is shown (PRD 7.7).
- My records. Answers a question from the member's own private records, fetched by session member ID only, with a report control on the answer. Balance answers stay off until the desk has shown fourteen consecutive days of same day cash entry (FR-47b); until then this feature answers attendance only.
- Check in. A four digit daily code, typed inside the building during opening hours.
- Pay. Renewal or arrears payment through the payment gateway named in Stack below, settling into the gym's own account, extending membership automatically on confirmation. Only a verified server side webhook may mark a payment successful, a browser redirect is never proof (FR-24). A repeated attempt returns the existing record, never a second charge (FR-26).
- Ask the desk. Names the officer on duty and opens WhatsApp with the member's question pre typed.

The report control on Ask about the gym and My records is part of those two features, not a separate sixth feature. Owner and staff screens are how records get in; they are not member facing features.

## Not in scope items for the MVP

Cut for version one, not planned for any later version:
- Contacting a member first, for any reason, by any channel. Every message to her is something she opened the app or tapped a button to see.
- Class booking and capacity.
- Push notifications, reminders, or nudges of any kind.
- Trainer chat or member to staff messaging inside the app.
- Progress tracking, weight logs, or body metrics.
- Referrals, streaks, or leaderboards.
- Door access control.
- Support for more than one gym. Not built now, but every model still carries a gym ID field.
- A native Android app.

Deferred to a later version. Each item below has a specific numeric trigger recorded in PRD 5.3. Do not build any of them without being told in writing that the trigger is met:
- Renewal reminders.
- Attendance nudges.
- New card suggestions drawn from unanswered questions.
- Failed payment recovery.
- Answer quality tuning from logged outcomes.

Do not implement anything in either list above unless explicitly instructed in the current task.

## Stack

- Framework: Next.js, App Router, TypeScript.
- ORM: Prisma.
- Database: PostgreSQL with pgvector for embedded card content. Use a pooled connection for the application and a separate unpooled connection only for schema migrations (PRD 8.1).
- Scheduled jobs: two required, one to rotate the daily check in code, one nightly sweep for abandoned payments and log checks (PRD 8.1). Do not replace either with an on request computation.
- Payments: gateway not finalized. The PRD specifies Paystack throughout (8.1, F-4); this project has been told to use Flutterwave instead. Do not write any payment integration code until this is confirmed in writing by [name the specific decision owner here].
- AI models: Gemini API, free tier. Exact model choices and limits are set out in the PRD, not repeated here, and must be verified before building because free tiers change.

## Folder map

Paths the PRD names directly:
- `app/api/**` is where the Next.js route handlers live. No route handler may import the database client directly.
- `src/server/auth/session.ts` is the only place the member session cookie is read. Member ID and effective tier come from here, never from a request body.
- `src/server/private/*.ts` reads a member's own private records. Every exported function takes the member ID as its first argument, and logs the read.
- `src/server/router/rules.ts` holds the never answer list, checked before any model call and before retrieval.
- `src/server/retrieval/search.ts` holds the shared card search. It filters on card status, card version status, and effective tier together, inside the query, before ranking (FR-11).
- `src/server/retrieval/index-card.ts` writes a card's searchable content when the owner approves it.

Staff and owner screens use their own middleware, cookie name, and session handling, entirely separate from `src/server/auth/session.ts` (PRD 6.8, 6.9, 8.3). Never route a staff or owner request through the member session.

If a task needs a file or folder not listed here, do not guess its name or location. Ask, or say so and stop.

## How to work in this codebase

- Make one change at a time.
- Ask before adding a package.
- Never write to the database with anything but the ORM, except inside `src/server/retrieval/search.ts` and `src/server/retrieval/index-card.ts`, which use raw SQL only for the vector column, and only for that column. Do not add any other raw SQL anywhere, and do not add new raw SQL purposes to those two files.
- List assumptions at the end of every response.
- Stop and ask when the PRD is silent about something the task needs.

## Where the detailed rules live

- The full data model: `prisma/schema.prisma`. If it does not exist yet, ask before creating one.
- The never answer list and its exact wording: `src/server/router/rules.ts`.
- The shared card search and its status and tier filter: `src/server/retrieval/search.ts`.
- Card indexing on approval: `src/server/retrieval/index-card.ts`.
- Session and member ID handling: `src/server/auth/session.ts`.
- Private record reads and access logging: `src/server/private/*.ts`.
- The grounding check that verifies an answer against its source chunks: PRD section 7.7. No implementation file is named yet; ask before creating one.
- All numeric thresholds, prices, durations, and free tier limits: the PRD itself, not this file.

## Definitions

- Tier. A member's access level: Basic or Premium.
- Effective tier. The tier actually used to decide what a member can see. It equals her stored tier while her membership status is active or in grace, and drops to Basic once expired or cancelled. Only the effective tier is ever passed into a search.
- Membership status. One of four computed values: active, in grace, expired, cancelled. Never stored directly, always computed from expiry date and grace period.
- Card. A single piece of shared content, with a title, a body, a category, and a minimum tier, drafted by staff and approved by the owner. Only an approved card, with an approved current version, can be found by a member.
- Chunk. A piece of an approved card prepared for search. A card under the word limit stated in PRD section 9 is one chunk, its title plus its body. A longer card is split by that same section's rule into several chunks, each with the title repeated at the start. Do not guess the word limit, read it from the PRD.
- Record. A general PRD word for any stored fact, shared or private. It is not a formal category. Use `card`, `chunk`, or `tier` instead of `record` whenever one of those precise terms applies.
- Never answer list. The five fixed refusal categories from FR-35: another member's information, anything medical, whether the door opens right now, refunds or waivers or discounts or cancellation decisions, and staff conduct complaints.
- Report control. Lets a member flag a shown answer as wrong. A reported answer appears on the owner's weekly review (FR-49).
- Handoff. The named front desk officer and WhatsApp link shown when Spotter has no answer, refuses a question, or a member asks for a person directly.