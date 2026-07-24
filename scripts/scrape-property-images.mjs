/**
 * Property Image Scraper for Hornza
 *
 * Fetches property images from developer websites (scraped_url)
 * and updates the listings table with image arrays.
 *
 * Usage:
 *   node scripts/scrape-property-images.mjs
 *
 * Requirements:
 *   npm install cheerio
 *   .env.local must have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { load } from 'cheerio';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env from .env.local
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('WARNING: Using anon key — updates may be blocked by RLS. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.\n');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Delay helper to avoid rate-limiting
const delay = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Fetch HTML from a URL with timeout and error handling
 */
async function fetchPage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.warn(`  Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

/**
 * Extract property images from a page using common patterns
 */
function extractImages(html, pageUrl) {
  const $ = load(html);
  const images = new Set();
  const baseUrl = new URL(pageUrl).origin;

  // Common selectors for property images on real estate sites
  const selectors = [
    // Gallery/slider images
    '.gallery img',
    '.slider img',
    '.swiper img',
    '.carousel img',
    '.slick img',
    '.property-gallery img',
    '.property-images img',
    '.property-slider img',
    '.project-gallery img',
    '.project-images img',
    // WordPress gallery patterns
    '.wp-block-gallery img',
    '.gallery-item img',
    '.elementor-image img',
    '.elementor-widget-image img',
    '.elementor-gallery img',
    // Common class patterns
    '[class*="gallery"] img',
    '[class*="slider"] img',
    '[class*="carousel"] img',
    '[class*="lightbox"] img',
    // Main content images (fallback)
    '.entry-content img',
    '.property-content img',
    'main img',
    'article img',
    '.content img',
    // Data attributes (lazy loaded)
    'img[data-src]',
    'img[data-lazy-src]',
    'img[data-srcset]',
    // Background images in divs
    '[style*="background-image"]',
  ];

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const $el = $(el);
      // Get image URL from various attributes
      let src = $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src') || '';

      // Handle background-image style
      if (!src && $el.attr('style')) {
        const match = $el.attr('style').match(/url\(['"]?([^'")\s]+)['"]?\)/);
        if (match) src = match[1];
      }

      // Handle srcset (take highest resolution)
      if (!src) {
        const srcset = $el.attr('srcset') || $el.attr('data-srcset') || '';
        if (srcset) {
          const parts = srcset.split(',').map(s => s.trim().split(/\s+/));
          const sorted = parts.sort((a, b) => {
            const aW = parseInt(a[1]) || 0;
            const bW = parseInt(b[1]) || 0;
            return bW - aW;
          });
          if (sorted[0]) src = sorted[0][0];
        }
      }

      if (!src) return;

      // Resolve relative URLs
      if (src.startsWith('//')) src = 'https:' + src;
      else if (src.startsWith('/')) src = baseUrl + src;
      else if (!src.startsWith('http')) src = baseUrl + '/' + src;

      // Filter out tiny icons, logos, placeholders
      const lower = src.toLowerCase();
      if (lower.includes('logo') || lower.includes('favicon') || lower.includes('icon')) return;
      if (lower.includes('placeholder') || lower.includes('loading') || lower.includes('spinner')) return;
      if (lower.includes('avatar') || lower.includes('author') || lower.includes('profile')) return;
      if (lower.match(/\d+x\d+/) && lower.match(/(\d+)x(\d+)/)) {
        const [, w, h] = lower.match(/(\d+)x(\d+)/);
        if (parseInt(w) < 200 || parseInt(h) < 150) return;
      }

      // Only keep common image extensions
      if (lower.match(/\.(jpg|jpeg|png|webp|avif)/)) {
        images.add(src);
      } else if (!lower.match(/\.(svg|gif|ico)/)) {
        // Could be a dynamic URL without extension — include it
        images.add(src);
      }
    });
  }

  return [...images].slice(0, 10); // Max 10 images per property
}

/**
 * Main scraping logic
 */
async function main() {
  console.log('Hornza Property Image Scraper');
  console.log('================================\n');

  // Fetch all scraped listings that have no images or empty images
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, title, scraped_url, scraped_source, images')
    .eq('is_scraped', true)
    .not('scraped_url', 'is', null);

  if (error) {
    console.error('Error fetching listings:', error.message);
    process.exit(1);
  }

  // Filter to ones that need images
  const needsImages = listings.filter(l => !l.images || l.images.length === 0);

  console.log(`Found ${listings.length} scraped listings total`);
  console.log(`${needsImages.length} need images\n`);

  if (needsImages.length === 0) {
    console.log('All listings already have images. Nothing to do.');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const listing of needsImages) {
    console.log(`[${listing.scraped_source}] ${listing.title}`);
    console.log(`  URL: ${listing.scraped_url}`);

    const html = await fetchPage(listing.scraped_url);
    if (!html) {
      failed++;
      console.log('  SKIPPED (fetch failed)\n');
      await delay(1000);
      continue;
    }

    const images = extractImages(html, listing.scraped_url);

    if (images.length === 0) {
      console.log('  No images found on page');
      failed++;
    } else {
      console.log(`  Found ${images.length} images`);
      images.forEach((img, i) => console.log(`    ${i + 1}. ${img.substring(0, 80)}...`));

      // Update the listing with scraped images
      const { error: updateError } = await supabase
        .from('listings')
        .update({ images })
        .eq('id', listing.id);

      if (updateError) {
        console.log(`  ERROR updating: ${updateError.message}`);
        failed++;
      } else {
        console.log('  UPDATED successfully');
        success++;
      }
    }

    console.log('');
    await delay(2000); // Be respectful — 2s between requests
  }

  console.log('================================');
  console.log(`Done! ${success} updated, ${failed} failed out of ${needsImages.length} total.`);
}

main().catch(console.error);
