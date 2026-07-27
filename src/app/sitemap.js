import { createClient } from '@supabase/supabase-js'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.hornza.org'

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

  // ── Dynamic pages from Supabase ────────────────────────────────────────
  const dynamicPages = []

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )

    // Verified listings
    const { data: listings } = await supabase
      .from('listings')
      .select('id, updated_at')
      .eq('verification_status', 'verified')

    for (const l of listings ?? []) {
      dynamicPages.push({
        url: `${SITE}/listing/${l.id}`,
        lastModified: l.updated_at ?? now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }

    // Verified apartments
    const { data: apartments } = await supabase
      .from('apartments')
      .select('id, updated_at')
      .eq('verification_status', 'verified')

    for (const a of apartments ?? []) {
      dynamicPages.push({
        url: `${SITE}/property/${a.id}`,
        lastModified: a.updated_at ?? now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch {
    // Supabase unavailable at build time — return static pages only
  }

  return [...staticPages, ...dynamicPages]
}
