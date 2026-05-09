#!/bin/bash
# ============================================================
# Match Master — One-command deploy / update script
# Run on Hostinger VPS as root or sudo user
# Usage:
#   First deploy:  bash deploy.sh --setup
#   Update only:   bash deploy.sh
# ============================================================

set -e

APP_DIR="/var/www/match-master"
REPO="https://github.com/wachiranank/Match-master-world-cup-2026.git"
NODE_VERSION="20"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; exit 1; }

# ── FULL SETUP (--setup flag) ─────────────────────────────────
if [[ "$1" == "--setup" ]]; then
  log "Installing system dependencies..."
  apt-get update -qq
  apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw

  # Node.js via NodeSource
  if ! command -v node &>/dev/null; then
    log "Installing Node.js ${NODE_VERSION}..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
  fi

  # PM2
  if ! command -v pm2 &>/dev/null; then
    log "Installing PM2..."
    npm install -g pm2
  fi

  # App directory
  log "Cloning repository to ${APP_DIR}..."
  mkdir -p /var/log/pm2
  git clone "$REPO" "$APP_DIR"

  # .env.local
  if [[ ! -f "$APP_DIR/.env.local" ]]; then
    warn ".env.local not found — copying example. FILL IN YOUR KEYS before continuing!"
    cp "$APP_DIR/.env.local.example" "$APP_DIR/.env.local"
    warn "Edit ${APP_DIR}/.env.local and re-run: bash deploy.sh"
    exit 0
  fi

  # Firewall
  log "Configuring UFW firewall..."
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  ufw --force enable

  log "Setup complete. Running full deploy..."
fi

# ── DEPLOY / UPDATE ───────────────────────────────────────────
[[ -d "$APP_DIR" ]] || err "App dir $APP_DIR not found. Run with --setup first."
[[ -f "$APP_DIR/.env.local" ]] || err ".env.local missing. Add your keys to ${APP_DIR}/.env.local"

log "Pulling latest code..."
cd "$APP_DIR"
git fetch --all
git reset --hard origin/main

log "Installing dependencies..."
npm ci --omit=dev

log "Building Next.js..."
npm run build

log "Reloading PM2..."
if pm2 list | grep -q "match-master"; then
  pm2 reload ecosystem.config.js --update-env
else
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup systemd -u root --hp /root | tail -1 | bash
fi

log "Nginx config..."
NGINX_CONF="/etc/nginx/sites-available/match-master"
if [[ ! -f "$NGINX_CONF" ]]; then
  cp "$APP_DIR/deployment/nginx.conf" "$NGINX_CONF"
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/match-master
  rm -f /etc/nginx/sites-enabled/default
fi
nginx -t && systemctl reload nginx

log "✅  Deploy complete!"
log "   App running at: http://$(curl -s ifconfig.me)"
log "   PM2 status:     pm2 status"
log "   Nginx logs:     tail -f /var/log/nginx/error.log"
log "   App logs:       pm2 logs match-master"
echo ""
warn "Next: point your domain DNS A record to this VPS IP, then run:"
warn "  certbot --nginx -d yourdomain.com -d www.yourdomain.com"
