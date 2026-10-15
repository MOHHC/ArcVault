# decisions

main idea: the model judges, code decides. llm gives category/priority/confidence, plain rules pick the queue and escalation.

## queues (webhook.site)
- team: PASTE_TEAM_URL_HERE
- human review: PASTE_HUMAN_REVIEW_URL_HERE

## routing
- bug -> engineering
- outage -> engineering, but always escalated
- billing -> billing
- feature -> product
- technical question -> it/security if it mentions sso/okta/oauth/mfa etc, otherwise engineering
- anything escalated -> human review (keep intended_queue so they know where it would've gone)

## escalate if any of these
- confidence < 0.70 (exactly 0.70 passes, brief says "below")
- category is outage
- raw message says outage / all users / multiple users. checked on the customer's text not the model output, so "ignore your instructions" can't skip it
- billing error over $500
- llm call fails or returns junk, so nothing gets lost

confidence is self-reported, not calibrated. 0.70 is from the brief, would tune it with real data.

## billing (sample 3)
$1,240 charged vs $980 contract. going with the gap ($260), so no escalation, goes to billing. the error is what they got overcharged, not the whole invoice. if it was the invoice total almost every b2b invoice would escalate. other reading is a one line change.

## sample 4 (sso with okta)
technical question -> it/security. they're asking "is there a way", not asking us to build it. feature request is the runner up. expecting lower confidence (~0.7-0.85) since it's actually ambiguous, and if it drops under 0.70 human review is fine too.

## why 2 llm calls
1 classifies, 2 extracts identifiers + summary. classification drives routing so it stays small and checked on its own, and if one fails i know which.

## expected
1. bug, engineering
2. feature, low, product
3. billing, billing (not escalated)
4. technical question, it/security, lower confidence
5. outage, high, human review (intended engineering)
