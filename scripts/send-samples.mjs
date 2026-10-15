// Sends each message in a JSON file to the n8n webhook, one at a time,
// prints a summary table and saves every record as the output file.
//
// Usage:
//   node scripts/send-samples.mjs
//   node scripts/send-samples.mjs --in data/edge-cases.json --out output/records-edge-cases.json
//   node scripts/send-samples.mjs --url http://localhost:5678/webhook-test/arcvault-intake
//
// Plain Node (18+), no packages. The .mjs extension allows import and top-level await.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[++i];
}

const url = args.url || "http://localhost:5678/webhook/arcvault-intake";
const inFile = args.in || "data/samples.json";
const outFile = args.out || "output/records.json";

const fail = (msg) => {
  console.error(`\nStopped: ${msg}\nNothing was saved.`);
  process.exit(1);
};

let samples;
try {
  samples = JSON.parse(await readFile(inFile, "utf8"));
} catch (e) {
  fail(`could not read ${inFile} as JSON (${e.message})`);
}
if (!Array.isArray(samples) || samples.length === 0)
  fail(`${inFile} must be a non-empty JSON array`);

const records = [];
for (const s of samples) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(s),
    });
  } catch {
    fail(`could not reach ${url}. Is n8n running?`);
  }
  const text = await res.text();
  if (res.status === 404)
    fail(
      `${s.id}: HTTP 404. Is the workflow published? (${text.slice(0, 200)})`,
    );
  if (!res.ok) fail(`${s.id}: HTTP ${res.status} ${text.slice(0, 300)}`);
  let record;
  try {
    record = JSON.parse(text);
  } catch {
    fail(`${s.id}: n8n answered but not with JSON: ${text.slice(0, 200)}`);
  }
  records.push(record);
  console.log(`sent ${s.id}`);
}

console.table(
  records.map((r) => ({
    id: r.id,
    category: r.category,
    priority: r.priority,
    confidence: r.confidence,
    queue: r.destination_queue,
    escalated: r.escalated,
  })),
);

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, JSON.stringify(records, null, 2) + "\n");
console.log(`Saved ${records.length} records to ${outFile}`);
