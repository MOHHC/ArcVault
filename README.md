# ArcVault Triage

An n8n workflow that takes customer messages, uses Groq to classify them and pull out the details, then uses plain code rules to route them to the right team or escalate them to Human Review.

The model judges and the code decides.

Webhook > classify (Groq) > check > enrich (Groq) > check > route and escalate (code) > team queue or Human Review > response

## How to run it

1. Start n8n (`npx n8n` or `n8n`) and import `workflow/arcvault-triage.json`
2. Add a Groq credential (n8n's Groq credential type) and pick it in both Groq nodes
3. Put your own webhook.site URLs in the "Human Review queue" and "Team queue" nodes
4. Publish the workflow, then run:

```
node scripts/send-samples.mjs
node scripts/send-samples.mjs --in data/edge-cases.json --out output/records-edge-cases.json
```

Needs Node 20+, no packages.

## Folders

- `data/` the 5 samples from the brief and 4 edge cases
- `prompts/` the classify and enrich prompts (v1 and v2)
- `n8n-code/` the code from each n8n Code node
- `scripts/` the send script
- `workflow/` the exported n8n workflow
- `output/` the records from the last run
- `docs/` the prompt doc and the write-up (PDFs)
- `screenshots/` the canvas, sample 5 and both queues
- `notes/` decisions, results and the AI log

## Results

| Sample | Category | Queue | Escalated |
|---|---|---|---|
| 1, 403 after update | Bug Report | Engineering | no |
| 2, bulk export | Feature Request | Product | no |
| 3, invoice mismatch | Billing Issue | Billing | no ($260 error) |
| 4, SSO with Okta | Technical Question (0.84) | IT/Security | no |
| 5, dashboard down | Incident/Outage | Human Review | yes |

Edge cases: a prompt injection with "down for all users" still escalated, "hey quick question" went to Human Review on low confidence, a $1,500 billing gap escalated, and a message with two problems only went to one queue (a known limitation).

## Decisions

- Billing error = the difference between the amounts, not the full invoice. Sample 3 is $260 so it doesn't escalate.
- Sample 4 is a Technical Question, with Feature Request as the runner up.
- Model: openai/gpt-oss-120b on Groq. Llama 3.3 was retired by Groq so I switched.

## How I used AI

I used Claude to help plan, write and test the code, and I set rules for it first (no API keys, don't edit the samples, explain changes before making them). I made the decisions and wrote the prompts, and everything it got wrong is in `notes/ai-log.md`.

## What the AI got wrong

- The plan used Llama 3.3, which Groq had already retired. The first real call returned "model does not exist".
- Claude said either n8n error setting was fine, but one of them sends failures down a separate branch so they would never escalate.
- Claude said n8n would still run without a "Respond to Webhook" node. It refuses to run at all.
- Groq kept rating a $260 billing mismatch as High, and a prompt fix only made it flip between High and Medium.
