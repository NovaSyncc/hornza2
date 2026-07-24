import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
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
}

const env = loadEnv();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data, error } = await supabase
  .from('listings')
  .select('id, title, images, scraped_source')
  .eq('is_scraped', true)
  .eq('service_type', 'sale')
  .limit(5);

if (error) { console.error(error); process.exit(1); }

for (const listing of data) {
  console.log(`\n${listing.title} [${listing.scraped_source}]`);
  console.log(`  images type: ${typeof listing.images}`);
  console.log(`  images value: ${JSON.stringify(listing.images)?.substring(0, 200)}`);
}
