/**
 * Update scraped listing prices from verified developer website data
 * Run: node scripts/update-scraped-prices.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const vars = {};
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      vars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
    return vars;
  } catch (e) {
    console.error('Could not read .env.local:', e.message);
    process.exit(1);
  }
}

const env = loadEnv();
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

// Price updates based on actual developer website data (July 2026)
// USD 1 = KES 130
const priceUpdates = [
  // Khaleel Homes
  { match: { title_like: 'Khaleel Suites — 3BR%', source: 'Khaleel Homes' }, price: 17500000 },

  // Naicom Homes (USD prices converted at 130)
  { match: { title_like: 'Naicom One%', source: 'Naicom Homes' }, price: 10400000 },       // 3BR $80K
  { match: { title_like: 'Maro Shopping Mall%', source: 'Naicom Homes' }, price: 10400000 }, // 3BR $80K
  { match: { title_like: 'Muthaiga Residency%', source: 'Naicom Homes' }, price: 12350000 }, // 4BR $95K
  { match: { title_like: 'Rodol Towers%', source: 'Naicom Homes' }, price: 20150000 },      // 4BR+DSQ $155K

  // Blue Falcon
  { match: { title_like: 'Safa Tower%', source: 'Blue Falcon Estate' }, price: 13000000 },  // 4BR $100K
];

async function main() {
  console.log('Updating scraped listing prices...\n');

  let updated = 0;
  let failed = 0;

  for (const { match, price } of priceUpdates) {
    const titlePattern = match.title_like.replace('%', '');

    // Find matching listings
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, sale_price')
      .eq('is_scraped', true)
      .eq('scraped_source', match.source)
      .ilike('title', match.title_like);

    if (fetchError) {
      console.log(`  ERROR finding "${titlePattern}": ${fetchError.message}`);
      failed++;
      continue;
    }

    if (!listings || listings.length === 0) {
      console.log(`  NOT FOUND: "${titlePattern}" from ${match.source}`);
      failed++;
      continue;
    }

    for (const listing of listings) {
      const { error: updateError } = await supabase
        .from('listings')
        .update({ sale_price: price })
        .eq('id', listing.id);

      if (updateError) {
        console.log(`  ERROR updating "${listing.title}": ${updateError.message}`);
        failed++;
      } else {
        const oldPrice = listing.sale_price ? `KES ${Number(listing.sale_price).toLocaleString()}` : 'NULL';
        console.log(`  UPDATED: ${listing.title}`);
        console.log(`    ${oldPrice} → KES ${price.toLocaleString()}`);
        updated++;
      }
    }
  }

  console.log(`\nDone! ${updated} updated, ${failed} failed.`);
}

main().catch(console.error);
