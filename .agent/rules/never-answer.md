---
description: Governs the fixed 5 refusal categories and front desk handoff in the question router.
trigger: model_decision
globs:
  - "src/server/router/**"
  - "app/api/ask/**"
---

# Never Answer List

This file governs `src/server/router/rules.ts`.
 
The app must refuse to answer five fixed categories of question, regardless of how the question is phrased:
 
1. Anything about another member, including whether they attended. Reason: it is that member's private information, and the asker has no claim to it.
2. Anything medical, including injury, pain, diet, supplements, or whether to train through something. Reason: a written gym record cannot judge a person's body, and a wrong answer can hurt her.
3. Whether the door will open right now. Reason: the app has no connection to the door, so any answer would be a guess.
4. Refunds, waivers, discounts, or cancellation decisions. Reason: these are decisions a person makes, not facts a record can state.
5. Staff conduct or a complaint about staff. Reason: a complaint needs a person to hear it, and an app answer could take a side.
Rules for how the list is applied:
 
- This check runs before any call to retrieval and before any call to a language model. Reason: a refusal decided after the model has already been asked adds cost for no benefit, and risks part of an answer leaking out before the refusal fires.
- The list is fixed. Adding or removing a category is a product decision that must be made in the PRD first, never only in code. Reason: this boundary is a promise to members about what the app will not do, and the code must never quietly drift from what was actually decided.
- When a question falls into one of these categories, the response is the handoff to the named front desk officer, not a partial answer or a workaround. Reason: a member asking one of these questions needs a person, not an approximation.