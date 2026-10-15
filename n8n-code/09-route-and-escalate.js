// n8n Code node "Route and escalate" (JavaScript, Run Once for Each Item)
// Pure rules, no LLM: "the model judges, code decides".
// Input from 2 places: "Parse enrichment", or the false branch of
// "Classified?" (classification failed), so classification and
// enrichment can both be null here.
// Output: one flat record per message.

const r = $json;
const c = r.classification || null;
const msg = String(r.message || '');
const reasons = [...(r.errors || [])];

// ROUTING
const securityWords = /\b(sso|saml|okta|oauth|mfa|2fa|scim|ldap|permissions?)\b/i;
const QUEUE = {
  'Bug Report': 'Engineering',
  'Incident/Outage': 'Engineering',
  'Billing Issue': 'Billing',
  'Feature Request': 'Product',
  'Technical Question': securityWords.test(msg) ? 'IT/Security' : 'Engineering',
};
const intended = c ? QUEUE[c.category] : null;

// ESCALATION: every rule that fires adds a reason
if (c && c.confidence < 0.7) reasons.push(`low confidence (${c.confidence})`); // exactly 0.70 passes
if (c && c.category === 'Incident/Outage') reasons.push('incident/outage');

// Checked on the customer's own text, not the model output,
// so "ignore your instructions" can't switch it off
const kw = msg.match(/\b(outage|down for all users|all users|multiple users)\b/i);
if (kw) reasons.push(`keyword "${kw[0]}"`);

// Billing: the error is the gap between the amounts in the message
// (option A, see notes/decisions.md). For option B (whole invoice) use:
// const billing = amounts.length ? Math.max(...amounts) : 0;
const amounts = [...msg.matchAll(/\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?/g)].map((m) =>
  Number(m[1].replace(/,/g, ''))
);
const billing = amounts.length >= 2 ? Math.max(...amounts) - Math.min(...amounts) : amounts[0] || 0;
if (c && c.category === 'Billing Issue' && billing > 500) {
  reasons.push(`billing error $${billing} over $500`);
}

const escalated = reasons.length > 0;

return {
  json: {
    id: r.id,
    received_at: r.received_at,
    source: r.source,
    raw_message: msg,
    category: c?.category ?? null,
    priority: c?.priority ?? null,
    confidence: c?.confidence ?? null,
    runner_up_category: c?.runner_up_category ?? null,
    rationale: c?.rationale ?? null,
    core_issue: r.enrichment?.core_issue ?? null,
    identifiers: r.enrichment?.identifiers ?? [],
    dropped_identifiers: r.enrichment?.dropped_identifiers ?? [],
    urgency: r.enrichment?.urgency ?? null,
    summary: r.enrichment?.summary ?? null,
    intended_queue: intended,
    destination_queue: escalated ? 'Human Review' : intended,
    escalated,
    escalation_reasons: reasons,
    model: 'openai/gpt-oss-120b',
    prompt_version: 'v1',
  },
};
