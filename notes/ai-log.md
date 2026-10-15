# AI log

Every time Claude or the model gets something wrong: what happened, how it got caught, and the fix.

| When | What happened | How it got caught | Fix |
|---|---|---|---|
| Thu Oct 15, task 8 | Claude's first check of samples.json crashed: it put the sample text inside a single-quoted shell command, and the apostrophe in "We'd" ended the string early | The command errored with a SyntaxError before checking anything | Moved the check into its own script file. All 5 samples then matched the brief exactly, with no BOM and the em dash intact. Lesson: text with apostrophes doesn't belong inline in shell commands, the same trap as hand-written JSON in n8n |
