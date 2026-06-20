#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${PUBLIC_KEY_B64:-}" ]]; then
  echo "PUBLIC_KEY_B64 is required." >&2
  exit 1
fi

PUBLIC_KEY="$(printf '%s' "$PUBLIC_KEY_B64" | base64 -d)"

if [[ "$PUBLIC_KEY" != ssh-ed25519\ * ]]; then
  echo "Refusing to install unexpected public key format." >&2
  exit 1
fi

echo "[remote] Running as: $(whoami)"
echo "[remote] Home: $HOME"

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"
touch "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"

if grep -qxF "$PUBLIC_KEY" "$HOME/.ssh/authorized_keys"; then
  echo "[remote] Public key already present in authorized_keys."
else
  printf '%s\n' "$PUBLIC_KEY" >> "$HOME/.ssh/authorized_keys"
  echo "[remote] Public key appended to authorized_keys."
fi

SSHD_DROPIN="/etc/ssh/sshd_config.d/99-local.conf"

if [[ -f "$SSHD_DROPIN" ]]; then
  BACKUP_PATH="$SSHD_DROPIN.backup.$(date +%Y%m%d-%H%M%S)"
  sudo cp "$SSHD_DROPIN" "$BACKUP_PATH"
  echo "[remote] Backed up $SSHD_DROPIN to $BACKUP_PATH"

  sudo sed -i \
    -e 's/^[[:space:]]*AuthenticationMethods[[:space:]]\+password[[:space:]]*$/#AuthenticationMethods password/' \
    -e 's/^[[:space:]]*PubkeyAuthentication[[:space:]]\+no[[:space:]]*$/PubkeyAuthentication yes/' \
    "$SSHD_DROPIN"
else
  echo "[remote] Drop-in not found, creating $SSHD_DROPIN"
  printf '%s\n' 'PubkeyAuthentication yes' | sudo tee "$SSHD_DROPIN" >/dev/null
fi

if ! sudo grep -RqiE '^[[:space:]]*PubkeyAuthentication[[:space:]]+yes' /etc/ssh/sshd_config /etc/ssh/sshd_config.d 2>/dev/null; then
  printf '%s\n' 'PubkeyAuthentication yes' | sudo tee -a "$SSHD_DROPIN" >/dev/null
  echo "[remote] Added PubkeyAuthentication yes."
fi

echo "[remote] Validating sshd config..."
sudo sshd -t

echo "[remote] Reloading sshd..."
sudo systemctl reload sshd

echo "[remote] Effective auth settings:"
sudo sshd -T | grep -E '^(pubkeyauthentication|authorizedkeysfile|passwordauthentication|authenticationmethods) '

