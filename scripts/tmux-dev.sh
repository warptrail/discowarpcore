#!/usr/bin/env bash

SESSION="dev"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

# If session exists → attach
if tmux has-session -t "$SESSION" 2>/dev/null; then
  exec tmux attach -t "$SESSION"
fi

# Create new session
tmux new-session -d -s "$SESSION" -n editor -c "$PROJECT"

# Split into top (0) and bottom (1)
tmux split-window -v -t "${SESSION}:editor" -c "$PROJECT"

# --- TOP PANE (API / backend) ---
tmux select-pane -t "${SESSION}:editor.1"
tmux select-pane -T "API SERVER"
tmux send-keys "clear" C-m
tmux send-keys "npm run dev" C-m

# --- BOTTOM PANE (Frontend / Vite) ---
tmux select-pane -t "${SESSION}:editor.2"
tmux select-pane -T "FRONTEND"
tmux send-keys "clear" C-m
tmux send-keys "npm run dev --prefix frontend" C-m

# Focus top pane
tmux select-pane -t "${SESSION}:editor.1"

# Attach
exec tmux attach -t "$SESSION"
