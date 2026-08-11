#!/usr/bin/env bash
set -euo pipefail

ssh_host="${DISCO_SSH_HOST:-neonazoth}"
remote_repo="${DISCO_REMOTE_REPO:-/home/warptrail/discowarpcore}"
remote_node="${DISCO_REMOTE_NODE:-/usr/bin/node}"
remote_api_base="${DISCO_REMOTE_API_BASE:-http://127.0.0.1:5002/api}"

remote_command=$(printf 'env DISCO_API_BASE=%q %q %q' \
  "$remote_api_base" \
  "$remote_node" \
  "$remote_repo/mcp/inventoryServer.mjs")

exec ssh -T "$ssh_host" "$remote_command"

