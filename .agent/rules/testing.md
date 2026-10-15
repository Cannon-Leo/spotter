---
description: Governs test requirements, coverage criteria, and definitions of done for money and access control.
trigger: always_on
---

# Testing

This file governs what must be tested before a change counts as done.
 
- Any function that makes a decision or a calculation gets an automated test before the task is marked done. Reason: untested logic is a guess about whether it works, not a fact about it.
- Code that touches money, access control, or another person's data always ships with a test, no exception. Reason: these are the categories where a silent bug is expensive or unsafe, not just annoying.
- A failing test blocks a merge. Reason: a red test is information, and ignoring it throws that information away.
- Never comment out, skip, or delete a test to make a build pass. Reason: that hides the failure instead of fixing it, and the next person assumes a real pass.
- Do not write a test for something a build tool, linter, or type checker already catches. Reason: a duplicate check adds upkeep without adding coverage.
- When a bug is fixed, add a test that would have caught it. Reason: without one, the same bug can come back unnoticed.