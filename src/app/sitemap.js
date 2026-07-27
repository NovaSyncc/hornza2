import { createClient } from '@supabase/supabase-js'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.hornza.org'

// Revalidate sitemap every 60 minutes
export const revalidate = 3600

export default async function sitemap() {
  const now = new Date().toISOString()

  // ── Static pages ───────────────────────────────────────────────────────
  const staticPages = [
    { url: SITE, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE}/properties`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/properties?type=rental`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/properties?type=furnished`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/properties?type=sale`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]

  // ── Location pages (local SEO) ────────────────────────────────────────
  const locations = [
    'Eastleigh',
    'Section 1, Eastleigh',
    'Section 2, Eastleigh',
    'Section 3, Eastleigh',
    'Section 7, Eastleigh',
    'California, Eastleigh',
    'Jam Street, Eastleigh',
    'Eastleigh South',
    'Eastleigh North',
    'South C',
    'Pangani',
    'Huruma',
    'Nairobi',
    'Mombasa',
  ]

  const locationPages = locations.map((loc) => ({
    url: `${SITE}/properties?location=${encodeURIComponent(loc)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // ── Dynamic pages from Supabase ────────────────────────────────────────
  const dynamicPages = []

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )

    // All public listings (not just verified — more pages indexed)
    const { data: listings } = await supabase
      .from('listings')
      .select('id, updated_at, service_type, location')

    for (const l of listings ?? []) {
      dynamicPages.push({
        url: `${SITE}/listing/${l.id}`,
        lastModified: l.updated_at ?? now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }

    // All public apartments
    const { data: apartments } = await supabase
      .from('apartments')
      .select('id, updated_at')

    for (const a of apartments ?? []) {
      dynamicPages.push({
        url: `${SITE}/property/${a.id}`,
        lastModified: a.updated_at ?? now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch {
    // Supabase unavailable at build time — return static + location pages only
  }

  return [...staticPages, ...locationPages, ...dynamicPages]
}
