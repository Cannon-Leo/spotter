---
name: change-schema
description: Applies one change to the Spotter Prisma data model in the right order. Use when adding or changing a model or a field.
---

# Change the schema

## Steps

1. Find the model or field in PRD section 8.5. If it is not there, stop and ask me before you change anything.
2. Decide if the model is private or shared. Look for a PRIVATE comment on the model in the PRD schema. If there is none, check the excluded list in `rules/retrieval-and-grounding.md`. If you still cannot tell, ask me. State your answer in your reply.
3. If the model is private, add its name to the excluded list in `rules/retrieval-and-grounding.md`. Check that the name now appears in that list.
4. Edit the Prisma schema. Change only what step 1 found.
5. Generate the migration file using the direct connection named in `rules/environment.md`. Check that the file lists only the change from step 4.
6. Do not apply the migration. Tell me it is ready and wait for me to apply it.
7. Search `src/server/retrieval/` for the name of every private model. Check that there are zero matches.
8. Commit the schema change and its migration file as one commit. Follow `rules/git-workflow.md`.