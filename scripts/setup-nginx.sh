#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo ./scripts/setup-nginx.sh

NGINX_CONF="scripts/nginx-app.conf"
DEST="/etc/nginx/sites-available/app.fotoshareai.com"
LINK="/etc/nginx/sites-enabled/app.fotoshareai.com"

if [[ ! -f "${NGINX_CONF}" ]]; then
  echo "Missing ${NGINX_CONF}"
  exit 1
fi

sudo cp "${NGINX_CONF}" "${DEST}"
sudo ln -sf "${DEST}" "${LINK}"
sudo nginx -t
sudo systemctl reload nginx
echo "Nginx configured for app.fotoshareai.com -> http://127.0.0.1:8080"
