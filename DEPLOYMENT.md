# Match Master — Deployment Manual

---

## 🇹🇭 ภาษาไทย

### ภาพรวม

แอปนี้ใช้ Next.js 16, Supabase, PM2 และ Nginx รันบน Hostinger VPS (Ubuntu 24.04)

---

### ความต้องการก่อนติดตั้ง

- Hostinger VPS (Ubuntu 24.04) พร้อม IP สาธารณะ
- โดเมนที่ชี้ A Record มาที่ IP ของ VPS (เช่น janefg.online → 72.60.233.7)
- บัญชี Supabase พร้อม Project URL, Anon Key, Service Role Key
- บัญชี GitHub พร้อม repo: `https://github.com/wachiranank/Match-master-world-cup-2026.git`
- (ถ้าต้องการ Google Login) Google OAuth Client ID และ Client Secret

---

### ขั้นตอนที่ 1 — เตรียม Supabase

1. เปิด Supabase → **SQL Editor** แล้วรัน SQL ไฟล์ตามลำดับ:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_seed_teams.sql
   supabase/migrations/003_seed_matches.sql
   supabase/migrations/004_scoring_function.sql
   ```

2. ไปที่ **Authentication → Providers → Google** แล้วเปิดใช้งานพร้อมใส่ Client ID และ Client Secret

3. ไปที่ **Authentication → URL Configuration** ตั้งค่า:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: เพิ่ม
     ```
     https://yourdomain.com/th/callback
     https://yourdomain.com/en/callback
     ```

---

### ขั้นตอนที่ 2 — ติดตั้ง VPS ครั้งแรก (--setup)

SSH เข้า VPS แล้วรัน:

```bash
ssh root@YOUR_VPS_IP

# โคลน repo และติดตั้งระบบ
git clone https://github.com/wachiranank/Match-master-world-cup-2026.git /var/www/match-master
bash /var/www/match-master/deployment/deploy.sh --setup
```

สคริปต์จะติดตั้งอัตโนมัติ: Node.js 20, PM2, Nginx, Certbot, UFW

---

### ขั้นตอนที่ 3 — ตั้งค่า Environment Variables

```bash
nano /var/www/match-master/.env.local
```

ใส่ข้อมูลดังนี้:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SCORING_SECRET=your-strong-random-secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

### ขั้นตอนที่ 4 — Build และ Deploy

```bash
bash /var/www/match-master/deployment/deploy.sh
```

สคริปต์จะทำ:
1. `git pull` ดึงโค้ดล่าสุด
2. `npm install` ติดตั้ง dependencies
3. `next build` build แอป
4. reload PM2 (หรือ start ใหม่ถ้ายังไม่มี)
5. ตั้งค่า Nginx (ถ้ายังไม่มี config)

---

### ขั้นตอนที่ 5 — ตั้งค่า SSL (HTTPS)

> ต้องให้โดเมน DNS ชี้มาที่ IP ของ VPS ก่อน

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive --agree-tos -m your@email.com
```

---

### ขั้นตอนที่ 6 — ตั้งค่า Cron Job (คำนวณคะแนน)

แก้ไข domain ในไฟล์ cron:

```bash
sed -i 's|https://yourdomain.com|https://yourdomain.com|g' \
  /var/www/match-master/deployment/score-cron.sh
chmod +x /var/www/match-master/deployment/score-cron.sh
```

เพิ่ม cron job:

```bash
crontab -e
# เพิ่มบรรทัดนี้:
*/10 * * * * /var/www/match-master/deployment/score-cron.sh >> /var/log/mm-score.log 2>&1
```

---

### การอัปเดตโค้ด (ครั้งต่อไป)

```bash
cd /var/www/match-master && git pull && bash deployment/deploy.sh
```

---

### คำสั่งที่ใช้บ่อย

```bash
# ดูสถานะแอป
pm2 status

# ดู log แอป
pm2 logs match-master

# restart แอป
pm2 restart match-master

# ดู log Nginx
tail -f /var/log/nginx/error.log

# ดู log คะแนน
tail -f /var/log/mm-score.log

# ต่ออายุ SSL certificate (ทำเองอัตโนมัติ แต่ทดสอบได้)
certbot renew --dry-run
```

---

### แก้ปัญหาที่พบบ่อย

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| 502 Bad Gateway | PM2 crash หรือ Nginx buffer เล็กเกินไป | `pm2 restart match-master` หรือเพิ่ม `proxy_buffer_size 128k` ใน nginx |
| ERR_SSL_PROTOCOL_ERROR | port 3000 รั่วออกมาใน Location header | เพิ่ม `proxy_redirect https://domain:3000/ https://domain/;` ใน nginx |
| OAuth redirect ไป localhost | `NEXT_PUBLIC_APP_URL` ไม่ได้ตั้งใน .env.local | เพิ่ม `NEXT_PUBLIC_APP_URL=https://yourdomain.com` แล้ว rebuild |
| npm ci error | package-lock.json ไม่ sync | ใช้ `npm install` แทน `npm ci` |

---
---

## 🇬🇧 English

### Overview

This app uses Next.js 16, Supabase, PM2, and Nginx running on a Hostinger VPS (Ubuntu 24.04).

---

### Prerequisites

- Hostinger VPS (Ubuntu 24.04) with a public IP address
- Domain with an A record pointing to the VPS IP (e.g. janefg.online → 72.60.233.7)
- Supabase project with URL, Anon Key, and Service Role Key
- GitHub account with repo: `https://github.com/wachiranank/Match-master-world-cup-2026.git`
- (For Google Login) Google OAuth Client ID and Client Secret

---

### Step 1 — Prepare Supabase

1. Open Supabase → **SQL Editor** and run these files in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_seed_teams.sql
   supabase/migrations/003_seed_matches.sql
   supabase/migrations/004_scoring_function.sql
   ```

2. Go to **Authentication → Providers → Google**, enable it and enter your Client ID and Client Secret.

3. Go to **Authentication → URL Configuration** and set:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: add
     ```
     https://yourdomain.com/th/callback
     https://yourdomain.com/en/callback
     ```

---

### Step 2 — First-time VPS Setup (--setup)

SSH into the VPS and run:

```bash
ssh root@YOUR_VPS_IP

# Clone repo and run full setup
git clone https://github.com/wachiranank/Match-master-world-cup-2026.git /var/www/match-master
bash /var/www/match-master/deployment/deploy.sh --setup
```

The script will automatically install: Node.js 20, PM2, Nginx, Certbot, UFW.

---

### Step 3 — Configure Environment Variables

```bash
nano /var/www/match-master/.env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SCORING_SECRET=your-strong-random-secret
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

### Step 4 — Build and Deploy

```bash
bash /var/www/match-master/deployment/deploy.sh
```

The script will:
1. `git pull` — fetch latest code
2. `npm install` — install dependencies
3. `next build` — build the app
4. Reload PM2 (or start fresh if not running)
5. Configure Nginx (if config doesn't exist yet)

---

### Step 5 — Set Up SSL (HTTPS)

> Your domain DNS must point to the VPS IP first.

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com \
  --non-interactive --agree-tos -m your@email.com
```

---

### Step 6 — Set Up Scoring Cron Job

Update the domain in the cron script:

```bash
sed -i 's|https://yourdomain.com|https://yourdomain.com|g' \
  /var/www/match-master/deployment/score-cron.sh
chmod +x /var/www/match-master/deployment/score-cron.sh
```

Add the cron job:

```bash
crontab -e
# Add this line:
*/10 * * * * /var/www/match-master/deployment/score-cron.sh >> /var/log/mm-score.log 2>&1
```

---

### Updating the App (subsequent deploys)

```bash
cd /var/www/match-master && git pull && bash deployment/deploy.sh
```

---

### Common Commands

```bash
# Check app status
pm2 status

# View app logs
pm2 logs match-master

# Restart app
pm2 restart match-master

# View Nginx error log
tail -f /var/log/nginx/error.log

# View scoring cron log
tail -f /var/log/mm-score.log

# Test SSL certificate renewal
certbot renew --dry-run
```

---

### Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| 502 Bad Gateway | PM2 crash or Nginx buffer too small | `pm2 restart match-master` or add `proxy_buffer_size 128k` to nginx config |
| ERR_SSL_PROTOCOL_ERROR | Port 3000 leaking into Location header | Add `proxy_redirect https://domain:3000/ https://domain/;` to nginx |
| OAuth redirects to localhost | `NEXT_PUBLIC_APP_URL` not set in .env.local | Add `NEXT_PUBLIC_APP_URL=https://yourdomain.com` and rebuild |
| npm ci error | package-lock.json out of sync | Use `npm install` instead of `npm ci` |
| Certbot rate limit (hstgr.cloud) | Too many certs issued for shared subdomain | Use a custom domain instead |
