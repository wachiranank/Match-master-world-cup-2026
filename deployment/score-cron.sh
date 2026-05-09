#!/bin/bash
# ============================================================
# Scoring cron — calls /api/score-matches every 10 minutes.
# Add to crontab: crontab -e
#   */10 * * * * /var/www/match-master/deployment/score-cron.sh >> /var/log/mm-score.log 2>&1
# ============================================================

DOMAIN="https://yourdomain.com"
SECRET="mm2026-score-secret-change-in-production"   # must match .env.local SCORING_SECRET

curl -s -X POST "${DOMAIN}/api/score-matches" \
  -H "x-scoring-secret: ${SECRET}" \
  -H "Content-Type: application/json" \
  -d '{}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'[{__import__(\"datetime\").datetime.now():%Y-%m-%d %H:%M}] {d}')"
