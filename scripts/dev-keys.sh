#!/usr/bin/env bash
# Generates a development-only RSA keypair for JWT signing (RS256), per the course
# norm (Anexo G) and ADR-009. Never run this against qa or main — production keys
# are provisioned by the identity service, not by this script.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYS_DIR="$ROOT_DIR/keys"
mkdir -p "$KEYS_DIR"

openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$KEYS_DIR/jwt-private.pem"
openssl pkey -in "$KEYS_DIR/jwt-private.pem" -pubout -out "$KEYS_DIR/jwt-public.pem"

# Collapse each PEM into a single line with literal \n, the format .env expects.
to_env_line() {
  awk '{printf "%s\\n", $0}' "$1"
}

PRIVATE_LINE="$(to_env_line "$KEYS_DIR/jwt-private.pem")"
PUBLIC_LINE="$(to_env_line "$KEYS_DIR/jwt-public.pem")"

write_env() {
  local env_file="$1"
  touch "$env_file"
  grep -v '^JWT_PRIVATE_KEY=' "$env_file" | grep -v '^JWT_PUBLIC_KEY=' > "$env_file.tmp" || true
  mv "$env_file.tmp" "$env_file"
  echo "JWT_PRIVATE_KEY=$PRIVATE_LINE" >> "$env_file"
  echo "JWT_PUBLIC_KEY=$PUBLIC_LINE" >> "$env_file"
  echo "Wrote JWT_PRIVATE_KEY and JWT_PUBLIC_KEY to $env_file"
}

# Two targets: root .env (docker compose reads variables from here) and
# apps/api/.env (NestJS reads this one directly when you run `npm run dev`).
write_env "$ROOT_DIR/.env"
write_env "$ROOT_DIR/apps/api/.env"

echo "Keys also saved to $KEYS_DIR/ (ignored by git)"
