---
description: Governs database connection URLs (pooled vs direct), API keys, and inline environment variable reads.
trigger: model_decision
globs:
  - ".env*"
  - "src/server/db/**"
  - "prisma/**"
---

# Environment Variables

This file governs where configuration values come from. See `rules/security.md` for how they must be handled once they exist; this file only names where each one is used.
 
- `DATABASE_URL` is the pooled database connection. It must carry the parameters `pgbouncer=true` and `connection_limit=1`. The running application uses only this one. Reason: without the pooled connection and those parameters, serverless functions exhaust database connections under normal traffic.
- `DIRECT_URL` is the unpooled database connection. Only the migration tool uses it. The application never does. Reason: the unpooled connection is not built for many short lived serverless requests, and the two are not interchangeable.
- The Gemini API key and the payment gateway's key or keys are required, but their exact variable names are not fixed by the PRD. Ask before naming a new one, and check whether an existing name is already in use before creating a second variable for the same value. Reason: an invented name that does not match what is actually deployed fails silently at runtime, not at build time.
- Every variable is read at the point it is used, never copied into a second constant or config object that outlives the request. Reason: a copied secret is a second place it could be exposed or forgotten.