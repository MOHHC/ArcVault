// n8n Code node "Parse classification" (JavaScript, Run Once for Each Item)
// Input: the "Groq classify" HTTP node, so $json is Groq's reply.
// Our own fields are gone after an HTTP node, so we take them back
// from "Build classify request".
// Output: our fields + classification (or null) + errors[]

const rec = { ...$('Build classify request').item.json };
delete rec.req; // don't carry the big prompt forward

const CATS = ['Bug Report', 'Feature Request', 'Billing Issue', 'Technical Question', 'Incident/Outage'];
const PRIS = ['Low', 'Medium', 'High'];
let classification = null;
const errors = [];

if ($json.error) {
  // "On Error: Continue" puts the failure here instead of crashing
  errors.push('classify: LLM call failed');
} else {
  const raw = $json.choices?.[0]?.message?.content ?? '';
  try {
    const p = JSON.parse(raw);
    let conf = Number(p.confidence);
    if (conf > 1 && conf <= 100) conf = conf / 100; // "85" -> 0.85

    if (!CATS.includes(p.category)) {
      errors.push(`classify: bad category "${p.category}"`);
    } else if (!PRIS.includes(p.priority)) {
      errors.push(`classify: bad priority "${p.priority}"`);
    } else if (!(conf >= 0 && conf <= 1)) {
      errors.push(`classify: bad confidence "${p.confidence}"`);
    } else {
      classification = {
        category: p.category,
        priority: p.priority,
        confidence: Math.round(conf * 100) / 100,
        runner_up_category:
          CATS.includes(p.runner_up_category) && p.runner_up_category !== p.category
            ? p.runner_up_category
            : null,
        rationale: String(p.rationale || ''),
      };
    }
  } catch (e) {
    errors.push('classify: reply was not valid JSON');
  }
}

return { json: { ...rec, classification, errors } };
