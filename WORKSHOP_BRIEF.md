# Workshop Brief — "การพัฒนา Web App ด้วย Claude Code"
## โครงการ: Match Master — FIFA World Cup 2026 Prediction App

> เอกสารนี้สรุปข้อมูลทั้งหมดของโครงการจริงที่พัฒนาด้วย Claude Code  
> จัดทำเพื่อใช้เป็นข้อมูลสำหรับสร้างเอกสารเทรนนิ่ง Workshop

---

## 1. ภาพรวมโครงการ

### โจทย์ (Problem Statement)
สร้าง Web Application สำหรับทายผลการแข่งขัน FIFA World Cup 2026 พร้อม Leaderboard จัดอันดับแบบ Real-time รองรับ 2 ภาษา (ไทย/อังกฤษ)

### ผลลัพธ์ที่ได้
- Web App ทำงานจริงที่ https://janefg.online
- พัฒนาครบในเซสชันเดียว (1 วัน) โดยใช้ Claude Code เป็นหลัก
- โค้ด ~3,000+ บรรทัด ครอบคลุม Frontend, Backend, Database, Deployment

### ประเด็นที่น่าสนใจสำหรับ Workshop
- ผู้พัฒนา **ไม่ต้องเขียนโค้ดเอง** — ใช้การสั่งงานเป็นภาษาธรรมดา
- Claude Code แก้ปัญหา Error แบบ Real-time ได้เอง
- Deploy จริงบน Production Server ผ่าน Claude Code

---

## 2. Tech Stack

| ส่วน | เทคโนโลยี | เหตุผลที่เลือก |
|---|---|---|
| **Framework** | Next.js 16.2.6 (App Router) | Server Components, Server Actions, Built-in routing |
| **Language** | TypeScript | Type safety, IntelliSense |
| **Styling** | Tailwind CSS v4 | Utility-first, เร็ว |
| **UI Components** | Radix UI (via Shadcn/UI) | Accessible, Unstyled base |
| **Database** | Supabase (PostgreSQL) | Auth + Database + API ในที่เดียว |
| **Auth** | Supabase Auth | Email/Password + Google OAuth |
| **i18n** | next-intl v4 | Locale routing, Server/Client translations |
| **Process Manager** | PM2 | Cluster mode, Auto-restart |
| **Web Server** | Nginx | Reverse proxy, SSL termination |
| **SSL** | Let's Encrypt (Certbot) | Free SSL certificate |
| **Hosting** | Hostinger VPS (Ubuntu 24.04) | Full control, ราคาเข้าถึงได้ |
| **Version Control** | GitHub | Source of truth สำหรับ deploy |

---

## 3. สถาปัตยกรรมระบบ (Architecture)

```
User Browser
     │
     ▼ HTTPS
Cloudflare / DNS
     │
     ▼ HTTPS (port 443)
Nginx (Reverse Proxy)
     │  - SSL termination
     │  - Proxy buffer management
     │  - Redirect rules
     ▼ HTTP (port 3000)
PM2 Cluster (2 instances)
     │
     ▼
Next.js App (App Router)
     │
     ├── Server Components (data fetching)
     ├── Server Actions (mutations)
     ├── Route Handlers (API endpoints)
     └── Middleware/Proxy (auth guard + i18n)
          │
          ▼
     Supabase
     ├── PostgreSQL Database
     ├── Auth (session cookies)
     └── REST API
```

---

## 4. Database Schema

### ตาราง (Tables)
```
profiles          — ข้อมูลผู้ใช้ (id, display_name, avatar_url, total_points)
teams             — 48 ทีม World Cup (name_en, name_th, flag, confederation)
matches           — นัดการแข่งขัน (home/away teams, kick_off, scores, status, stage_key)
predictions       — คำทายผลของผู้ใช้ (user_id, match_id, predicted_home, predicted_away)
champion_picks    — การทายแชมป์ (user_id, team_id)
stage_multipliers — ตัวคูณคะแนนแต่ละรอบ
leaderboard       — View สำหรับจัดอันดับ
```

### ระบบคะแนน
| ผลลัพธ์ | คะแนน |
|---|---|
| ทายผลแพ้/ชนะ/เสมอ ถูก | 1 คะแนน |
| ทายสกอร์ถูกทั้งคู่ | 1 + 3 = 4 คะแนน |
| ทายแชมป์ถูก | +50 คะแนน Bonus |

คะแนนคูณด้วย Stage Multiplier:
```
Group Stage  ×1 | Round of 32 ×2 | Round of 16 ×3
Quarter-final ×4 | Semi-final ×5  | Final ×6
```

---

## 5. ฟีเจอร์ทั้งหมดที่สร้าง

### Frontend Pages (9 routes)
| หน้า | URL | คำอธิบาย |
|---|---|---|
| Home | `/` | Landing page, ข้อมูลการแข่งขัน |
| Sign Up | `/sign-up` | สมัครสมาชิก email/password |
| Sign In | `/sign-in` | เข้าสู่ระบบ + Google OAuth |
| Dashboard | `/dashboard` | สรุปคะแนน, อันดับ, ประวัติ |
| Predictions | `/predictions` | ทายผลแต่ละนัด (ล็อคหลัง kick-off) |
| Champion Pick | `/champion` | ทายแชมป์ (ล็อคหลัง 11 มิ.ย. 2026) |
| Leaderboard | `/leaderboard` | จัดอันดับผู้เล่นทั้งหมด |
| Admin | `/admin` | จัดการ match + trigger scoring |
| Admin Matches | `/admin/matches` | เพิ่ม/แก้ไข match ทุกรอบ |

### Backend APIs
```
POST /api/score-matches    — คำนวณคะแนน (protected by SCORING_SECRET)
POST /api/score-champion   — คะแนน bonus แชมป์
```

### Automation
- Cron Job ทุก 10 นาที — เรียก `/api/score-matches` อัตโนมัติ
- PM2 Cluster Mode — รัน 2 instances ขนานกัน
- Auto SSL Renewal — Certbot timer ทำงานทุกวัน

---

## 6. กระบวนการพัฒนา (Development Process)

### Prompt แรก (Master Prompt)
ผู้ใช้ส่ง Prompt ขนาดใหญ่ครั้งเดียว ระบุ:
- ชื่อโปรเจกต์, Tech Stack, Features ทั้งหมด
- Database schema ที่ต้องการ
- ระบบคะแนน, กติกา, deadline
- ภาษาที่รองรับ (TH/EN)

Claude Code ตอบด้วย **แผน 7 ขั้นตอน** และขอ Confirm ก่อน implement

### ขั้นตอนการพัฒนา
```
Step 1: Project Setup
  → สร้าง Next.js project, ติดตั้ง dependencies, ตั้งค่า i18n routing

Step 2: Authentication
  → Supabase Auth, Email/Password + Google OAuth, Protected routes

Step 3: Predictions Feature
  → Match cards, Score inputs, Lock mechanism, Server Actions

Step 4: Champion Pick
  → 48-team grid, Confederation grouping, Search, Countdown timer

Step 5: Leaderboard
  → Ranking table, Accuracy stats, Champion flag display

Step 6: Scoring Engine
  → calcPoints() utility, /api/score-matches, Atomic DB update via RPC

Step 7: Deployment
  → GitHub push, VPS setup, PM2, Nginx, SSL, Cron job
```

### Bonus: Admin Panel (เพิ่มทีหลัง)
```
→ Match management UI
→ Add knockout round matches
→ Update match results
→ Trigger scoring manually
```

---

## 7. ปัญหาที่พบและวิธีที่ Claude Code แก้ไข

### 7.1 Shadcn/UI เลือก Base UI แทน Radix UI
**ปัญหา:** `shadcn init` ติดตั้ง Base UI (Experimental) แทน Radix UI ทำให้ components ไม่มี `asChild` prop  
**Claude Code แก้:** เขียน component ใหม่ทั้งหมดโดยใช้ `@radix-ui/*` โดยตรง

### 7.2 Next.js 16 เปลี่ยนชื่อ middleware
**ปัญหา:** Next.js 16 เปลี่ยน `middleware.ts` เป็น `proxy.ts` และ export `proxy` แทน `middleware`  
**Claude Code แก้:** Rename file และ update export ตาม deprecation warning

### 7.3 TypeScript `never` type จาก Supabase join
**ปัญหา:** Query ที่มี foreign key join คืน `never` type แทน data  
**Claude Code แก้:** ใช้ `.returns<any[]>()` และ type assertion `as any`

### 7.4 `npm ci` ล้มเหลวบน VPS
**ปัญหา:** `package-lock.json` ไม่ sync กับ npm version บน VPS  
**Claude Code แก้:** เปลี่ยน deploy script ใช้ `npm install` แทน `npm ci`

### 7.5 Tailwind อยู่ใน devDependencies
**ปัญหา:** `npm install --omit=dev` ไม่ติดตั้ง `@tailwindcss/postcss` ทำให้ build ล้มเหลว  
**Claude Code แก้:** ย้าย `tailwindcss` และ `@tailwindcss/postcss` ไปใน `dependencies`

### 7.6 Nginx buffer เล็กเกินไป (502 Error)
**ปัญหา:** Supabase session cookie ขนาดใหญ่ทำให้ Nginx คืน 502 ที่ `/callback`  
**Claude Code แก้:** เพิ่ม proxy buffer config ใน Nginx
```nginx
proxy_buffer_size    128k;
proxy_buffers        4 256k;
proxy_busy_buffers_size 256k;
```

### 7.7 Port 3000 รั่วใน redirect URL
**ปัญหา:** Next.js redirect ไปยัง `https://domain.com:3000/th` แทน `https://domain.com/th`  
**Claude Code แก้:** เพิ่ม `proxy_redirect` ใน Nginx + fix callback route ใช้ `X-Forwarded-Host`

### 7.8 Docker container ยึด port 443
**ปัญหา:** Traefik Docker container ที่ติดมากับ VPS ยึด port 443 ก่อน Nginx  
**Claude Code แก้:** SSH เข้า VPS, หา container, stop และ remove แล้ว restart Nginx

### 7.9 OAuth callback redirect ไป localhost
**ปัญหา:** Supabase OAuth redirect URL ในไฟล์ `callback/route.ts` ใช้ `request.url` ซึ่งเป็น internal URL  
**Claude Code แก้:** ใช้ `X-Forwarded-Host` header และ `NEXT_PUBLIC_APP_URL` env var แทน

### 7.10 Let's Encrypt rate limit (hstgr.cloud)
**ปัญหา:** Hostinger subdomain ถูก rate limit เพราะลูกค้าหลายรายใช้ `hstgr.cloud`  
**Claude Code วิเคราะห์:** แนะนำ 3 ทางออก, ผู้ใช้เลือกซื้อ custom domain ใหม่

---

## 8. Pattern การใช้งาน Claude Code ที่น่าสนใจ

### Pattern 1: Master Prompt
ส่ง Prompt ครั้งเดียวที่ระบุ requirements ครบถ้วน แล้วให้ Claude วางแผนก่อน implement
```
"สร้าง Match Master World Cup 2026 ด้วย Next.js 16, Supabase, next-intl...
 รองรับ TH/EN, มีระบบคะแนน, Leaderboard, Champion Pick..."
```

### Pattern 2: Step-by-step Confirmation
```
User: "go step 3"
Claude: implement Predictions feature ครบทั้งหมด
User: "go step 4"
...
```

### Pattern 3: Live Error Fixing
เมื่อเจอ error บน VPS, Copy/paste terminal output → Claude แก้ได้ทันที

### Pattern 4: SSH Remote Execution
Claude Code สามารถ SSH เข้า Server และรัน command ได้โดยตรง:
```bash
# Claude ทำให้อัตโนมัติ
ssh root@YOUR_VPS_IP → git pull → npm run build → pm2 reload
```

### Pattern 5: Iterative Problem Solving
ปัญหา DNS/SSL/Nginx แก้หลายรอบ → Claude ไม่หยุด วิเคราะห์ root cause ใหม่ทุกครั้ง

---

## 9. สิ่งที่ Claude Code ทำได้ในโปรเจกต์นี้

✅ เขียนโค้ดทั้งหมดตั้งแต่ต้น (Frontend + Backend + DB)  
✅ ออกแบบ Database Schema  
✅ แก้ TypeScript errors  
✅ วินิจฉัยและแก้ Production bugs  
✅ SSH เข้า Server และรัน deployment  
✅ Debug Nginx configuration  
✅ จัดการ SSL certificate  
✅ เขียน deployment script  
✅ สร้าง bilingual documentation  
✅ Commit และ Push ขึ้น GitHub  

---

## 10. สิ่งที่ผู้ใช้ต้องทำเอง (Human in the Loop)

❗ ให้สิทธิ์ SSH (บอก password ให้ Claude)  
❗ สร้าง Supabase project และรัน SQL migrations  
❗ ตั้งค่า Google OAuth credentials บน Google Cloud Console  
❗ ซื้อและตั้งค่า domain (DNS A record)  
❗ ตั้งค่า Cloudflare / Namecheap  
❗ ใส่ข้อมูล sensitive (API keys) ใน .env.local เอง  

---

## 11. ตัวเลขที่น่าสนใจ

| รายการ | ตัวเลข |
|---|---|
| เวลาพัฒนารวม | ~1 วัน (1 session) |
| จำนวนไฟล์ที่สร้าง | 40+ ไฟล์ |
| บรรทัดโค้ด | ~3,500+ บรรทัด |
| จำนวน Routes | 15 routes |
| จำนวน Database Tables | 7 tables |
| จำนวนทีม World Cup ที่ seed | 48 ทีม |
| จำนวน Match ที่ seed (Group Stage) | 24 นัด |
| ปัญหาที่แก้ระหว่าง deployment | 10+ ปัญหา |
| ภาษาที่รองรับ | 2 (TH/EN) |

---

## 12. Prompt Engineering Tips สำหรับ Workshop

### DO ✅
- ระบุ Tech Stack ที่ต้องการชัดเจน
- บอก Business Logic ครบ (ระบบคะแนน, กฎการล็อค, deadline)
- บอก Constraints (เช่น "ใช้ Radix UI ไม่ใช่ Base UI")
- ให้ Error message เต็มๆ เวลาแจ้ง bug
- บอก Production URL จริงเวลา deploy

### DON'T ❌
- อย่า prompt กว้างเกินไป ("สร้าง web app ดีๆ ให้หน่อย")
- อย่าข้ามขั้นตอน — ให้ confirm ผลแต่ละ step ก่อน
- อย่าลืม sensitive information ไม่ควรส่งใน prompt (แต่ทีมนี้จำเป็นต้องใช้ SSH)

---

## 13. GitHub Repository

```
https://github.com/wachiranank/Match-master-world-cup-2026
```

### โครงสร้างหลัก
```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/      — sign-in, sign-up, callback
│   │   ├── (main)/      — dashboard, predictions, champion, leaderboard
│   │   └── (admin)/     — admin panel
│   ├── actions/         — server actions (predictions, champion, admin)
│   └── api/             — score-matches, score-champion
├── components/
│   ├── ui/              — Button, Card, Input, etc.
│   ├── auth/            — AuthForm
│   ├── layout/          — Navbar
│   ├── predictions/     — MatchCard
│   ├── champion/        — ChampionPicker, CountdownBanner
│   └── leaderboard/     — LeaderboardTable
├── lib/
│   ├── supabase/        — browser + server clients
│   └── i18n-helpers.ts  — calcPoints, STAGE_MULTIPLIERS
├── i18n/routing.ts
├── messages/th.json
├── messages/en.json
└── proxy.ts             — middleware (auth guard + i18n)

deployment/
├── deploy.sh            — one-command deploy script
├── nginx.conf           — reverse proxy config
└── score-cron.sh        — scoring cron wrapper

supabase/migrations/
├── 001_initial_schema.sql
├── 002_seed_teams.sql
├── 003_seed_matches.sql
└── 004_scoring_function.sql
```

---

## 14. Live Demo

**URL:** https://janefg.online  
**GitHub:** https://github.com/wachiranank/Match-master-world-cup-2026  

---

*จัดทำโดย Claude Code — Anthropic | สรุปจากการพัฒนาโปรเจกต์จริง 9 พ.ค. 2026*
