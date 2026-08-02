
setopt NO_BEEP NO_NOMATCH
function tarot() { command node "$TAROT_DOCK_SCRIPT" control "$@"; }
function awaken() {
  if [[ "$1" == '--scry' || "$1" == '--follow' ]]; then
    tarot awaken
    command node "$TAROT_DOCK_SCRIPT" follow-all
  else
    tarot awaken "$@"
  fi
}
function raise() { awaken "$@"; }
function status() { tarot status; }
function deck() { tarot deck; }
function scry() { if (( $# )); then tarot scry "$@"; else command node "$TAROT_DOCK_SCRIPT" portal; fi; }
function scry-all() { command node "$TAROT_DOCK_SCRIPT" follow-all; }
function view() { tarot view "$@"; }
function logs() { tarot logs "$@"; }
function help() { tarot help; }
function start() { tarot start "$@"; }
function stop() { tarot stop "$@"; }
function restart() { tarot restart "$@"; }
function ports() { tarot ports; }
function links() { tarot links; }
function tarot-select() { tarot select "$@"; }
function copy() { tarot copy "$@"; }
function c() { tarot copy lan; }
function C() { tarot copy lan; }
function 1() { tarot copy 1; }
function 2() { tarot copy 2; }
function 3() { tarot copy 3; }
function mongo() { tarot mongo "$@"; }
function banish() { tarot banish; }
function farewell() { tarot farewell; exit; }
setopt PROMPT_SUBST
typeset -g TAROT_PROMPT_SIGIL="$TAROT_SIGIL"
typeset -g TAROT_PROMPT_STATUS=""
typeset -g TAROT_PROMPT_BASE=""
typeset -g TAROT_WARP_ACTIVE=0
typeset -g TAROT_WARP_FRAME=0
function tarot_prompt_frame() {
  local length=${#TAROT_SIGIL}
  TAROT_WARP_FRAME=$(( (TAROT_WARP_FRAME + 1) % length ))
  TAROT_PROMPT_SIGIL="${TAROT_SIGIL:$TAROT_WARP_FRAME}${TAROT_SIGIL:0:$TAROT_WARP_FRAME}"
  if (( TAROT_WARP_ACTIVE )); then
    local cores=(◒ ◓ ◑ ◐)
    local core="${cores[$(( (TAROT_WARP_FRAME % ${#cores}) + 1 ))]}"
    TAROT_PROMPT_STATUS="${TAROT_PROMPT_BASE% active} $core"
  else
    TAROT_PROMPT_STATUS="${TAROT_PROMPT_BASE% quiet}"
  fi
}
function tarot_prompt_refresh() {
  TAROT_PROMPT_BASE="$(tarot prompt 2>/dev/null)"
  [[ "$TAROT_PROMPT_BASE" == *"active" ]] && TAROT_WARP_ACTIVE=1 || TAROT_WARP_ACTIVE=0
  tarot_prompt_frame
}
precmd_functions+=(tarot_prompt_refresh)
PROMPT='%F{$TAROT_ACCENT_COLOR}tarot@$TAROT_PROJECT%f %F{$TAROT_ACCENT_COLOR}[$TAROT_PROMPT_SIGIL]%f %F{$TAROT_ACCENT_COLOR} $TAROT_PROMPT_STATUS%f %F{$TAROT_ACCENT_COLOR}❯%f '
RPROMPT=''
