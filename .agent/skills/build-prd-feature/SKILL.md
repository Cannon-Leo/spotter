---
name: build-prd-feature
description: Builds one Spotter feature from its PRD section and proves each acceptance criterion with a test. Use when starting or finishing a feature from PRD sections 6.1 to 6.7.
---

# Build a PRD feature

## Steps

1. Open the PRD section for the feature. Copy out its FR numbers, its empty state text, its error state text, and its acceptance criteria. Some sections have no empty state or no error state. Note which ones are missing.
2. Write one line per acceptance criterion. Give each line a test name. Check that the number of test names equals the number of criteria.
3. Build the first FR only. Run its tests. Build the next FR only when those tests pass.
4. Add the empty state and the error state. Use the PRD text word for word. Do not reword it. If the feature needs one that the PRD does not give, ask me for the text.
5. Run every test on your list. Use `rules/testing.md` to decide what counts as a real test.
6. Mark any criterion that code cannot test as manual. Tell me which ones.
7. Report each criterion as pass, fail, or manual, with its test name.