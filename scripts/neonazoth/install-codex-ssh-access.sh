#!/usr/bin/env bash
set -euo pipefail

REMOTE="${REMOTE:-warptrail@neonazoth}"
REMOTE_ALIAS="${REMOTE_ALIAS:-neonazoth}"
KEY_PATH="${KEY_PATH:-$HOME/.ssh/neonazoth_warptrail_ed25519}"
KEY_COMMENT="${KEY_COMMENT:-codex-discowarpcore-neonazoth-warptrail}"
TEST_ONLY="${TEST_ONLY:-0}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_SCRIPT="$SCRIPT_DIR/neonazoth-enable-publickey-remote.sh"

if [[ ! -f "$REMOTE_SCRIPT" ]]; then
  echo "Remote setup script not found: $REMOTE_SCRIPT" >&2
  exit 1
fi

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [[ ! -f "$KEY_PATH" ]]; then
  echo "[local] Creating SSH key: $KEY_PATH"
  ssh-keygen -t ed25519 -f "$KEY_PATH" -N '' -C "$KEY_COMMENT"
else
  echo "[local] Reusing existing SSH key: $KEY_PATH"
fi

chmod 600 "$KEY_PATH"
chmod 644 "$KEY_PATH.pub"

PUBLIC_KEY="$(cat "$KEY_PATH.pub")"
PUBLIC_KEY_B64="$(printf '%s\n' "$PUBLIC_KEY" | base64 | tr -d '\n')"

if [[ "$TEST_ONLY" == "1" ]]; then
  echo "[local] Testing key login..."
  ssh -i "$KEY_PATH" -o BatchMode=yes -o PasswordAuthentication=no "$REMOTE" 'whoami && hostname && pwd'
  exit 0
fi

SSH_CONFIG="$HOME/.ssh/config"
touch "$SSH_CONFIG"
chmod 600 "$SSH_CONFIG"

if ! grep -Eq "^[[:space:]]*Host[[:space:]]+$REMOTE_ALIAS([[:space:]]|$)" "$SSH_CONFIG"; then
  CONFIG_BACKUP="$SSH_CONFIG.backup.$(date +%Y%m%d-%H%M%S)"
  cp "$SSH_CONFIG" "$CONFIG_BACKUP"
  cat >> "$SSH_CONFIG" <<EOF

Host $REMOTE_ALIAS
    HostName neonazoth
    User warptrail
    IdentityFile $KEY_PATH
    IdentitiesOnly yes
    Port 22
    ServerAliveInterval 30
    ServerAliveCountMax 3
EOF
  echo "[local] Added Host $REMOTE_ALIAS to $SSH_CONFIG"
  echo "[local] Config backup: $CONFIG_BACKUP"
else
  echo "[local] Host $REMOTE_ALIAS already exists in $SSH_CONFIG; leaving it unchanged."
fi

echo
echo "Remote sudo changes are intentionally not run over SSH by this script."
echo
echo "In your existing neonazoth SSH session, run this exact command:"
echo
printf "PUBLIC_KEY_B64='%s' bash -s <<'REMOTE_SETUP'\n" "$PUBLIC_KEY_B64"
sed 's/^/  /' "$REMOTE_SCRIPT"
printf "REMOTE_SETUP\n"
echo
echo "After that succeeds, rerun this local script with TEST_ONLY=1 to verify key login:"
echo "  TEST_ONLY=1 $0"
exit 0

echo "[local] Testing key login..."
ssh -i "$KEY_PATH" -o BatchMode=yes -o PasswordAuthentication=no "$REMOTE" 'whoami && hostname && pwd'

echo
echo "Done. Future access should work with:"
echo "  ssh $REMOTE_ALIAS"
