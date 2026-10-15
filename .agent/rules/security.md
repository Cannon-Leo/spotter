---
description: Governs secret handling, credential storage, zero committed secrets, and log sanitization.
trigger: always_on
---

# Security

This file governs how secrets and credentials are handled anywhere in this codebase.
 
- Never write a secret value directly in a source file. Reason: a committed secret stays in the git history forever, even after it is removed from the current version of the file.
- Read every credential from an environment variable. Never from a hardcoded string or a config file that gets committed. Reason: an environment variable can be rotated without touching code, a hardcoded value cannot.
- Never print, log, or return a secret value in a response, an error message, or a console log, even for debugging. Reason: logs are stored in plain text and read by more people than the code itself.
- Never commit a file that holds real credentials, including a `.env` file. Commit only an example file that lists the variable names with placeholder values. Reason: a real credential in git history cannot be fully removed later, only rotated.
- If a secret was already committed or printed, treat it as exposed. Tell me, rotate it at the provider, then remove it from the code. Deleting the line alone does not fix it. Reason: the old value stays in git history and logs, so only rotation makes it useless.
- If a task needs a new secret, stop and ask where it should be stored and what it should be named. Do not invent a name or a placeholder convention. Reason: an invented convention creates a second place to look for the same value.
- Apply this rule the same way to every kind of credential: an API key, a webhook signing secret, a database connection string. Reason: one consistent rule is easier to follow than a different rule per vendor.