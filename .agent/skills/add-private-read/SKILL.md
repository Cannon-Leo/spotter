---
name: add-private-read
description: Adds one function that reads a member's private data, and connects it to a member question when needed. Use when a feature needs attendance, balance, membership, or any other private record.
---

# Add a private read

## Steps

1. Name the data the function reads and who will call it. If the caller is staff, check that the data is attendance, tier, or expiry only. If staff would see a balance or payment history, stop and ask me. The rule is in `rules/auth-and-sessions.md`.
2. Add the function under `src/server/private/`. If no existing file fits, ask me for the file name.
3. Make the member ID the first argument. Check that every call passes the ID from the session and never from the request.
4. Write the access log row inside the function. Check that one call writes exactly one row.
5. Return plain rows from the function. Render the answer with a code template. Check that the language model never receives the rows.
6. If the data is a balance, call the one balance function. If it does not exist yet, add it once here and name it in your reply. Never write a second one.
7. If a member can ask for this by typing a question, add the intent so the router returns it. Check that the vector store is not called on this path.
8. Write two tests. One sends a request that carries another member's ID and expects the caller's own records. One expects a log row for every call.
9. Run the tests. Report each as pass or fail.