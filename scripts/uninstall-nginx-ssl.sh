#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo ./scripts/uninstall-nginx-ssl.sh

SITE="app.fotoshareai.com"
DEST="/etc/nginx/sites-available/${SITE}"
LINK="/etc/nginx/sites-enabled/${SITE}"

sudo rm -f "${LINK}"
sudo rm -f "${DEST}"
sudo nginx -t
sudo systemctl reload nginx

if command -v certbot >/dev/null 2>&1; then
  sudo certbot delete --cert-name "${SITE}" || true
fi

echo "Removed nginx config and certbot certificate for ${SITE}."
