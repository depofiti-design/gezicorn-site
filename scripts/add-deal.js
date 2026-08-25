// Usage: node add-deal.js deal.json
// deal.json (type=flight): { type:"flight", title, route_from, route_to, discount_label? }
// deal.json (type=gear):   { type:"gear", title, old_price?, new_price, discount_label?, affiliate_url }
import { readFileSync } from 'fs';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase-client.js';

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node add-deal.js deal.json');
  process.exit(1);
}

const deal = JSON.parse(readFileSync(jsonPath, 'utf-8'));

if (!['gear', 'flight'].includes(deal.type)) {
  console.error('type must be "gear" or "flight"');
  process.exit(1);
}
if (!deal.title || typeof deal.title !== 'string' || !deal.title.trim()) {
  console.error('Missing required field: title');
  process.exit(1);
}
if (deal.type === 'flight' && (!deal.route_from || !deal.route_to)) {
  console.error('type=flight requires route_from and route_to');
  process.exit(1);
}
if (deal.type === 'gear' && !deal.affiliate_url) {
  console.error('type=gear requires a real affiliate_url (no invented links)');
  process.exit(1);
}

const docRef = await addDoc(collection(db, 'deals'), {
  type: deal.type,
  title: deal.title,
  route_from: deal.route_from || null,
  route_to: deal.route_to || null,
  old_price: deal.old_price ?? null,
  new_price: deal.new_price ?? null,
  discount_label: deal.discount_label || null,
  affiliate_url: deal.affiliate_url || null,
  active: true,
  created_at: serverTimestamp()
});

console.log(`Deal added: ${docRef.id} (${deal.title})`);
process.exit(0);
