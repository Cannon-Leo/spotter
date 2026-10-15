---
description: Governs Git commit formatting, branching, single-domain changes, and merge requirements.
trigger: always_on
---

# Git Workflow

This file governs how changes are committed in this codebase.
 
- One commit contains one logical change. Reason: a mixed commit is hard to review and hard to revert without undoing something unrelated.
- Write a commit message that states what changed and why, in one line. Never "fix", "update", or "wip". Reason: a vague message is unreadable once the log has a hundred entries.
- Never commit directly to the main branch. Work on a branch named for the task. Reason: a branch can be reviewed and discarded without ever touching the working app.
- Do not merge a branch until the requirements in `rules/testing.md` are met for that change. Reason: a merge is the point where an untested change becomes everyone's problem.
- Never force push over a branch someone else may already have pulled. Reason: it can silently erase committed work that belongs to another person.
- Do not rewrite history on a shared branch. Reason: it breaks every other copy of that branch that already exists.
- Stop and ask before merging a change that spans more than one rules file's area of responsibility. Reason: a change that crosses domains, for example both payments and retrieval, usually means the task was not actually one change.