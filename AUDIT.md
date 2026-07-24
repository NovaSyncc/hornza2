# Hornza Project Audit

**Last Updated:** 2026-07-22
**Audited By:** Hulk (Claude Code)

---

## Table of Contents

1. [Feature Inventory](#1-feature-inventory)
2. [Database & Supabase Audit](#2-database--supabase-audit)
3. [Security Vulnerabilities](#3-security-vulnerabilities)
4. [Performance Issues](#4-performance-issues)

---

## 1. Feature Inventory

### Pages & Routes

| Page | Path | Status | Purpose |
|------|------|--------|---------|
| Home | `src/app/page.js` + `HomePageClient.js` | Complete | Landing with hero slideshow, property carousel, testimonials |
| Browse Properties | `src/app/properties/` | Complete | Multi-tab browsing (Rentals/Furnished/For Sale), advanced filtering |
| Property Details | `src/app/property/[id]/` | Partial | Legacy apartment detail view (apartments table) |
| Listing Details | `src/app/listing/[id]/` | Partial | New unified listing detail view |
| About | `src/app/about/` | Complete | Mission, story, vision, team bios |
| Contact | `src/app/contact/` | Partial | Contact form (no backend submission yet) |
| Register | `src/app/register/` | Complete | Registration with role selection (6 roles) |
| Login | `src/app/login/` | Complete | Email/password login with role-based redirect |

### Dashboards (Role-Based)

| Dashboard | Path | Status | Lines |
|-----------|------|--------|-------|
| Secretary | `src/app/dashboard/secretary/` | Complete | ~1263 |
| Manager | `src/app/dashboard/manager/` | Complete | ~449 |
| Broker | `src/app/dashboard/broker/` | Partial | — |
| Furnished Operator | `src/app/dashboard/operator/` | Partial | ~298 |
| Tenant | `src/app/dashboard/tenant/` | Placeholder | Mock data only |
| Admin | `src/app/dashboard/admin/` | Placeholder | Basic structure |

### Components

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| Navigation | `src/components/Navigation.js` | Complete | Header, desktop/mobile menus, role-based links |
| Footer | `src/components/Footer.js` | Complete | Multi-column footer, WhatsApp float |
| PropertyCard | `src/components/PropertyCard.js` | Complete | Reusable listing card with badges |
| SearchFilter | `src/components/SearchFilter.js` | Complete | Advanced filter panel |
| PropertyForm | `src/components/PropertyForm.js` | Partial | Legacy apartment creation form |
| ListingForm | `src/components/ListingForm.js` | Partial | Unified listing creation |
| BuildingForm | `src/components/BuildingForm.js` | Partial | Create building shell |
| ApartmentForm | `src/components/ApartmentForm.js` | Partial | Create units in buildings |
| PropertyListing | `src/components/PropertyListing.js` | Partial | Expandable building card |
| UserManagement | `src/components/UserManagement.js` | Placeholder | Admin user management |
| VerificationModal | `src/components/VerificationModal.js` | Placeholder | Verification workflow |
| AnimatedSection | `src/components/AnimatedSection.js` | Complete | Intersection observer animation wrapper |
| GeometricElements | `src/components/GeometricElements.js` | Complete | Animated background decorations |

### Hooks

| Hook | File | Status | Returns |
|------|------|--------|---------|
| useListings | `src/hooks/useListings.js` | Complete | `{ listings, loading, error, refreshListings }` |
| usePublicProperties | `src/hooks/usePublicProperties.js` | Complete | `{ properties, loading, error, refreshProperties }` |
| useBuildings | `src/hooks/useBuildings.js` | Complete | CRUD + `createBuildingWithApartment()` transaction |
| useMyListings | `src/hooks/useMyListings.js` | Complete | Full CRUD for user's own listings |
| useLeads | `src/hooks/useLeads.js` | Complete | Lead pipeline CRUD + stage transitions |
| useApartments | `src/hooks/useApartments.js` | Partial | `{ loading, error, createApartment() }` |
| useRealtimeSync | `src/hooks/useRealtimeSync.js` | Complete | Real-time Postgres subscriptions (debounced) |

### Contexts, Libs, Utils

| Item | File | Status |
|------|------|--------|
| AuthContext | `src/contexts/AuthContext.js` | Complete — signUp, signIn, signOut, fetchUserProfile |
| Supabase Client | `src/lib/supabase.js` | Complete — singleton client from env vars |
| Mock Data | `src/utils/mockData.js` | Complete — fallback data for 4 entities |

### Scripts

| Script | File | Status |
|--------|------|--------|
| scrape-property-images | `scripts/scrape-property-images.mjs` | Partial |
| insert-new-listings | `scripts/insert-new-listings.mjs` | Partial |
| update-scraped-prices | `scripts/update-scraped-prices.mjs` | Placeholder |
| check-images | `scripts/check-images.mjs` | Placeholder |

### Static Assets (public/)

- Logo, favicons, PWA manifest, robots.txt, sitemap.xml
- LLM context files (llms.txt, llms-full.txt)
- Static fallback pages (about.html, properties.html)

### Feature Status Summary

**Fully Implemented:** Auth (signup/login/logout), 6-role RBAC (client-side), property browsing with filters, building/apartment management, lead pipeline with commission tracking, real-time sync, image upload, WhatsApp integration, Instagram verification, responsive design, SEO metadata

**Partially Implemented:** Listing detail views, contact form, furnished operator features, broker dashboard, PDF generation, property scraping

**Not Started:** Analytics/reporting, payment integration, SMS/email notifications, video hosting, mobile app, AI search, tenant applications, insurance/legal docs

---

## 2. Database & Supabase Audit

### Schema (8 Tables)

| Table | Columns | Purpose |
|-------|---------|---------|
| users | id, full_name, phone, user_type, company_name, bio, is_broker, created_at | User profiles (mirrors auth.users) |
| buildings | id, manager_id, name, address, location, contact_phone, manager_whatsapp, amenities[], created_at | Property buildings |
| apartments | id, building_id, house_number, bedrooms, bathrooms, rent/deposit, sq_ft, features[], amenities[], images[], verification_status, instagram_url, etc. | Individual units (legacy) |
| listings | id, service_type, lister_id, lister_type, title, description, location, property details, pricing fields, broker fields, verification fields, scraping fields, etc. | Unified listings (new system) |
| verification_requests | id, apartment_id, building_id, listing_id, manager_id, status, created_at | Verification workflow |
| leads | id, secretary_id, listing_id, client info, stage, commission_amount, timestamps | Secretary CRM pipeline |
| lead_stage_history | id, lead_id, from_stage, to_stage, changed_by, notes, changed_at | Stage transition audit trail |

### Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| property-images | Public (authenticated upload) | Property photos |
| secretary-pdfs | Public (authenticated upload) | Generated PDF flyers |

### Migrations (9 files in supabase/migrations/)

1. `20260718_001_full_schema.sql` — Core schema, RLS, triggers, indexes
2. `20260719_001_security_fixes.sql` — Search path hardening, execution revocation
3. `20260720_001_remaining_security.sql` — Storage policy restriction
4. `20260721_001_scraped_listings.sql` — 61 scraped developer listings
5. `20260722_001_fix_rls_recursion.sql` — `is_admin()` function to fix infinite loop
6. `20260722_001_update_scraped_prices.sql` — Price corrections (KES conversion)
7. `20260722_002_new_scraped_listings.sql` — 11 more scraped listings (Wafi, Afrimac)
8. `20260723_001_fix_anon_access.sql` — Grant is_admin() to anon (returns false)
9. `20260724_001_secretary_leads.sql` — Leads pipeline + stage history

### RLS Status

RLS is **enabled** on all 7 user tables with policies for:
- Public read on verified listings/apartments
- Owner-scoped CRUD (manager_id, lister_id, secretary_id = auth.uid())
- Admin bypass via `is_admin()` SECURITY DEFINER function

### Database Issues Found

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| DB-1 | RLS recursion in leads table | CRITICAL | Admin policy on leads/lead_stage_history uses direct subquery instead of `is_admin()` — causes infinite loop |
| DB-2 | No pagination | HIGH | All queries fetch entire result sets — won't scale |
| DB-3 | Leads not in realtime publication | MEDIUM | Secretary dashboard won't auto-sync lead changes |
| DB-4 | Secretary can view ALL listings | MEDIUM | Over-permissive — should be scoped to their leads |
| DB-5 | Commission not snapshotted | LOW | Calculated from current sale_price, stale if price changes |
| DB-6 | No verification audit trail | LOW | Apartment verification changes aren't logged |
| DB-7 | CASCADE delete on buildings | LOW | Deleting a building silently removes all apartments |

---

## 3. Security Vulnerabilities

### CRITICAL

| # | Finding | Location | Risk |
|---|---------|----------|------|
| SEC-1 | No server-side route protection | All `/dashboard/*` pages | Unauthenticated users can access dashboard shells |
| SEC-2 | Supabase keys readable in .env.local | `.env.local` | If ever committed to git, full database access exposed |

### HIGH

| # | Finding | Location | Risk |
|---|---------|----------|------|
| SEC-3 | No server-side RBAC | Dashboard components | Privilege escalation — users can access other role dashboards |
| SEC-4 | Weak session handling | `AuthContext.js` | No periodic re-validation, no session timeout |
| SEC-5 | Insufficient input validation | All forms (ListingForm, RegisterPage) | XSS, injection via unsanitized text fields |
| SEC-6 | No API rate limiting | Auth + all Supabase queries | Brute force login, spam listings |
| SEC-7 | Weak file upload validation | `ListingForm.js` upload | Only checks file.type (spoofable), no size limit |
| SEC-8 | No email verification | `AuthContext.js` signUp | Fake accounts, no identity confirmation |

### MEDIUM

| # | Finding | Location | Risk |
|---|---------|----------|------|
| SEC-9 | No Content Security Policy | `next.config.mjs` | XSS/clickjacking |
| SEC-10 | No CSRF tokens | Contact form, other forms | CSRF attacks on future server-side forms |
| SEC-11 | No .env.example file | Project root | Developers must guess required env vars |
| SEC-12 | Unsafe data rendering | `ListingDetailClient.js` | Stored XSS via listing data |
| SEC-13 | Sensitive data in React state | Dashboard components | Accessible via DevTools |

### Recommended Security Actions

**Immediate:**
1. Rotate Supabase API keys (anon + service role)
2. Add Next.js middleware for route protection
3. Fix RLS recursion in leads table (use `is_admin()`)

**Short-term:**
4. Add input validation (Zod schema)
5. Enable email verification in Supabase
6. Add security headers (CSP, X-Frame-Options)
7. Implement file upload size limits + magic byte validation

---

## 4. Performance Issues

### HIGH Impact

| # | Finding | Detail |
|---|---------|--------|
| PERF-1 | No code splitting | Zero `dynamic()` or `React.lazy()` across 45 files — full bundle loads on every route |
| PERF-2 | 100% client-side rendering | Every component is `'use client'` — no server components for data fetching |
| PERF-3 | Waterfall data fetching | Auth → profile → data fetched sequentially, not parallelized |
| PERF-4 | No caching strategy | Empty next.config.mjs, no ISR/SSG, no query cache |
| PERF-5 | No pagination | Admin dashboard fetches ALL users, listings, verifications at once |

### MEDIUM Impact

| # | Finding | Detail |
|---|---------|--------|
| PERF-6 | No next/image usage | All images use raw `<img>` tags — no optimization, no sizing, layout shifts |
| PERF-7 | GeometricElements always renders | 6+ animated elements on every page, not lazy-loaded |
| PERF-8 | Duplicate CSS | Multiple overlapping glass-effect/gradient definitions in globals.css |
| PERF-9 | Tree-shaking broken | `require()` in HomePageClient.js prevents dead code elimination |
| PERF-10 | No image compression | Uploads go to Supabase at full size |

### LOW Impact (Well-Handled)

| # | Finding | Detail |
|---|---------|--------|
| PERF-11 | Font loading | next/font with Inter — properly optimized |
| PERF-12 | Third-party scripts | Minimal, no render-blocking scripts |
| PERF-13 | Memory leaks | Proper cleanup in hooks (useRealtimeSync, AuthContext, intervals) |

### Performance Summary

| Area | Status |
|------|--------|
| Bundle Size | FAIL — no code splitting |
| Image Optimization | FAIL — no next/image |
| Code Splitting | FAIL — zero dynamic imports |
| Server Components | FAIL — 100% client-side |
| Data Fetching | FAIL — waterfall patterns |
| Caching | FAIL — no strategy |
| CSS | PARTIAL — some duplication |
| Lazy Loading | FAIL — heavy components eager-loaded |
| Fonts | PASS |
| Third-party Scripts | PASS |
| Memory Leaks | PASS |

---

## Quick Reference: What Needs Fixing

### Priority 1 (Before any public launch)
- [ ] Rotate Supabase keys
- [ ] Add server-side route protection (Next.js middleware)
- [ ] Fix RLS recursion in leads table
- [ ] Add input validation on all forms
- [ ] Enable email verification

### Priority 2 (Before scaling)
- [ ] Implement code splitting with `dynamic()`
- [ ] Convert listing pages to server components
- [ ] Add pagination to all queries
- [ ] Migrate to `next/image`
- [ ] Add security headers (CSP)
- [ ] Implement rate limiting

### Priority 3 (Polish)
- [ ] Add query caching (SWR or React Query)
- [ ] Lazy-load GeometricElements and heavy animations
- [ ] Consolidate duplicate CSS
- [ ] Fix tree-shaking (replace `require()` with ES imports)
- [ ] Add leads to realtime publication
- [ ] Create .env.example
