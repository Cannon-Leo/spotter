---
description: Governs approved card search, tier filtering in SQL WHERE, raw SQL vector operations, and digit grounding checks.
trigger: model_decision
globs:
  - "src/server/retrieval/**"
  - "app/api/ask/**"
---

# Retrieval and Grounding

This file governs `src/server/retrieval/search.ts` and `src/server/retrieval/index-card.ts`.
 
## What may be searched
 
- A card qualifies for search only when its status is APPROVED, its current version's status is APPROVED, and its minimum tier is at or below the member's effective tier. Reason: an unapproved or unauthorized card shown to a member is the same failure as a card that never existed correctly.
- This filter runs inside the SQL WHERE clause, before ranking, never after. Reason: filtering after ranking still exposes disallowed content to the ranking step, which is the same exposure at a different point in the code.
- No private model may ever be imported, queried, or referenced anywhere under `src/server/retrieval/`. The excluded models are Member, CheckIn, LedgerEntry, Payment, PaymentAttempt, MembershipChange, MemberSession, ActivationCode, QuestionLog, and PrivateAccessLog. Reason: search across private data means one member's row can surface for another member's question, and no filter is careful enough to make that safe every time.
- When a private model is added to the schema, add its name to the excluded list above. Reason: the build check only blocks names on this list, so an unlisted private model would pass unchecked.
- If a future task asks for semantic search over private records, the answer is no. Stop and say so instead of building it. Reason: this is a deliberate product boundary, not a gap waiting to be filled.
- The app refuses to answer any member question while fewer than thirty cards hold status APPROVED. Reason: a near empty retrieval system that answers "I do not have that" more than once loses a member's trust before the app has proven anything.
## Chunking, runs when a card is approved
 
- A card under two hundred fifty words becomes one chunk: the title plus the body.
- A card over that length is split on blank lines into chunks of at most two hundred words each, with the title repeated at the start of every chunk. Reason: without the repeated title, a chunk drifts away from its subject once it is separated from the rest of its card.
- A timetable card gets one chunk per day of the week, each prefixed with the day name. The PRD marks this an assumption. Do not change it without asking. Reason: a question about Saturday should match a Saturday chunk directly, not compete against six other days packed into one block of text.
## Approval sequence, runs in index-card.ts
 
- Generate chunks from the new version's body first, with no database writes yet.
- Call the embedding API for every chunk, outside of any open database transaction. Reason: a transaction should never sit open across a network call to another company's service.
- If any embedding call fails, stop the whole approval. Nothing in the database changes, and the owner sees an error. Reason: a card must never be live and unindexed at the same time.
- Only after every embedding call succeeds, open a transaction that deletes the old version's chunks, inserts the new chunks with raw SQL, and marks the new version approved. Commit as one unit.
- All chunk writes and all chunk reads go through raw SQL only, and only in these two files. Reason: the database will not let the ORM client set the vector column at all, so this is not a style choice.
## Search behavior
 
- Drop any chunk below a cosine similarity of 0.70 before calling a language model. The PRD marks 0.70 as an assumption, a starting point and not a finding. The top score is logged on every question so the cutoff can be recalibrated in week two. Do not treat 0.70 as fixed, and do not change it without asking. Reason: a low similarity chunk is more likely to produce a wrong answer than no answer at all, but the right cutoff is only known once real questions have been logged.
- If nothing remains after that filter, return no answer and skip the language model entirely. Reason: calling a model with no real source content raises the odds it invents one.
- Call the language model at a temperature of zero. Reason: a model told to answer only from given text should give the same answer to the same question every time, not a creative one.
## The grounding check, runs after the model answers
 
- Extract every digit sequence from the model's answer. Extract every digit sequence from the source chunks and the question. Every digit in the answer must appear in one of those two sets.
- On a mismatch, discard the answer without trying to repair it, and return the no answer response with the handoff. Reason: a model that invented one number cannot be trusted to have gotten the rest of that sentence right either.
- Log every discard so it shows up on the owner's weekly review, not silently. Reason: a check that fires often but invisibly looks the same as a check that never fires at all.
- Numbers written out as words are not checked by this rule. Reason: normalizing every spelled out form is unreliable, and the costly mistakes, an invented price or an invented time, happen in numeral form.