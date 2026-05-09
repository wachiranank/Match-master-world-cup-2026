---
name: Match Master Project Setup
description: Tech stack, directory structure, and key decisions for the Match Master World Cup 2026 app
type: project
---

Match Master is a Next.js 16 (App Router) prediction app for FIFA World Cup 2026.

**Why:** Build a bilingual (TH/EN) web app where users predict match results and earn points.

**Stack:** Next.js 16 + App Router, Tailwind CSS, Shadcn/UI (Radix-based, manually written — NOT Base UI), next-intl (TH/EN), Supabase (@supabase/ssr), TypeScript.

**Key structural decisions:**
- Locale routing: `/src/app/[locale]/` — `src/proxy.ts` handles locale redirect (Next.js 16 renamed `middleware.ts` → `proxy.ts`)
- i18n config: `src/i18n/routing.ts` (locales: ['th','en'], default: 'th') + `src/i18n/request.ts`
- Message files: `src/messages/th.json` and `src/messages/en.json`
- Supabase schema: `supabase/migrations/001_initial_schema.sql`
- DB types: `src/types/database.ts`
- Localization helpers: `src/lib/i18n-helpers.ts` — `getLocaleName(record, locale, field)` utility
- Champion pick deadline: June 11 2026 00:00 UTC+7 (+50 pts bonus)
- Stage multipliers: group_stage x1, r32 x2, r16 x3, qf x4, sf x5, third_place x5, final x6
- Points: correct result +1, correct score +3, champion bonus +50

**How to apply:** Always use Radix-based Shadcn components (with asChild + Slot). Use `getLocaleName(record, locale)` for bilingual DB fields. Use `src/proxy.ts` not `middleware.ts`.
