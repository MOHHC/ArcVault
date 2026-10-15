# ArcVault triage

This is my take-home for an AI Engineer role. I review every line you write,
so explain what you're going to change before you change it.

## Hard rules

- Don't ask for, print or write any API key. The Groq key lives in the n8n
  credential and nowhere else.
- Don't edit data/samples.json. It's copied word for word from the brief.
- n8n runs in its own terminal on localhost:5678. Never start or stop it.
- Don't push to GitHub unless I ask.

## How the code works

- Code for n8n Code nodes goes in n8n-code/ as plain JS files. I paste them
  into n8n myself.
- Plain JavaScript, no npm packages.
- The Code nodes run in "Run Once for Each Item" mode and find each other by
  node name, so don't rename anything.

## What I do myself

- I write the prompts in prompts/ and the docs in docs/. You review them and
  list problems, you don't rewrite them.
- If a test result is wrong, fix the prompt, not my expected answer.

## Mistakes

When you get something wrong, or I catch something, add a line to
notes/ai-log.md: what happened, how it got caught, and the fix.
