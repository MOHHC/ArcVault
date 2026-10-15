// n8n Code node "Parse enrichment" (JavaScript, Run Once for Each Item)
// Input: the "Groq enrich" HTTP node, so $json is Groq's reply.
// Our fields come back from "Parse classification" (without the big req).
// Output: our fields + enrichment (or null) + errors[]

const rec = { ...$('Parse classification').item.json };
const errors = [...(rec.errors || [])];
const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
const LEVELS = ['none', 'low', 'medium', 'high', 'critical'];
let enrichment = null;

if ($json.error) {
  errors.push('enrich: LLM call failed');
} else {
  try {
    const p = JSON.parse($json.choices?.[0]?.message?.content ?? '');
    const level = String(p.urgency?.level ?? '').toLowerCase();
    if (!p.core_issue || !p.summary || !Array.isArray(p.identifiers) || !LEVELS.includes(level)) {
      errors.push('enrich: missing or invalid fields');
    } else {
      // GROUNDING CHECK: keep an identifier only if its value really appears
      // in the customer's message. Anything the model invented or reformatted
      // (e.g. "INV-4410" when the customer wrote "#4410") is dropped and kept
      // in dropped_identifiers so we can see it.
      const kept = [];
      const dropped = [];
      for (const i of p.identifiers) {
        if (i && i.value && norm(rec.message).includes(norm(i.value))) kept.push(i);
        else dropped.push(i);
      }
      enrichment = {
        core_issue: p.core_issue,
        identifiers: kept,
        urgency: { level, evidence: p.urgency?.evidence ?? null },
        summary: p.summary,
        dropped_identifiers: dropped,
      };
    }
  } catch (e) {
    errors.push('enrich: reply was not valid JSON');
  }
}

return { json: { ...rec, enrichment, errors } };
