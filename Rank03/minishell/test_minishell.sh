#!/usr/bin/env bash
set -u

# Single-file minishell test runner
# Run from minishell folder:
#   bash test_minishell.sh
# Run from repo root:
#   bash Rank03/minishell/test_minishell.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$ROOT_DIR/.test_minishell_tmp"
mkdir -p "$TMP_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

BUILD_DIR=""
BIN=""
BIN_NAME="minishell"

pass() { echo -e "${GREEN}[PASS]${NC} $*"; PASS=$((PASS + 1)); }
fail() { echo -e "${RED}[FAIL]${NC} $*"; FAIL=$((FAIL + 1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; WARN=$((WARN + 1)); }
info() { echo -e "${BLUE}[INFO]${NC} $*"; }

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

usage() {
  cat <<'EOT'
Usage:
  bash test_minishell.sh
  bash Rank03/minishell/test_minishell.sh

Optional:
  --skip-build   Skip make checks and use existing binary only
  -h, --help     Show this help
EOT
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

SKIP_BUILD=0
if [[ "${1:-}" == "--skip-build" ]]; then
  SKIP_BUILD=1
fi

has_required_flags() {
  local text="$1"
  [[ "$text" == *"-Wall"* && "$text" == *"-Wextra"* && "$text" == *"-Werror"* ]]
}

resolve_layout() {
  # Supports both layouts:
  # 1) minishell/Makefile
  # 2) minishell/sources/Makefile
  if [[ -f "$ROOT_DIR/Makefile" ]]; then
    BUILD_DIR="$ROOT_DIR"
  elif [[ -f "$ROOT_DIR/sources/Makefile" ]]; then
    BUILD_DIR="$ROOT_DIR/sources"
  else
    fail "No Makefile found in '$ROOT_DIR' or '$ROOT_DIR/sources'"
    return 1
  fi

  BIN_NAME="$(awk -F '=' '/^[[:space:]]*NAME[[:space:]]*=/{gsub(/[[:space:]]/,"",$2); print $2; exit}' "$BUILD_DIR/Makefile")"
  [[ -z "$BIN_NAME" ]] && BIN_NAME="minishell"

  # Try common binary locations
  if [[ -x "$BUILD_DIR/$BIN_NAME" ]]; then
    BIN="$BUILD_DIR/$BIN_NAME"
  elif [[ -x "$ROOT_DIR/$BIN_NAME" ]]; then
    BIN="$ROOT_DIR/$BIN_NAME"
  elif [[ -x "$ROOT_DIR/sources/$BIN_NAME" ]]; then
    BIN="$ROOT_DIR/sources/$BIN_NAME"
  else
    # fallback: any executable named minishell close to project root
    local discovered
    discovered="$(find "$ROOT_DIR" -maxdepth 3 -type f -name "$BIN_NAME" -perm -111 2>/dev/null | head -n 1)"
    if [[ -n "$discovered" ]]; then
      BIN="$discovered"
    else
      BIN="$BUILD_DIR/$BIN_NAME"
    fi
  fi

  info "Detected build dir: $BUILD_DIR"
  info "Expected binary path: $BIN"
}

run_make_checks() {
  info "1) Compile checks"

  if (( SKIP_BUILD == 1 )); then
    warn "Skipping build checks (--skip-build)"
    return 0
  fi

  local dry_out mk
  dry_out="$(make -C "$BUILD_DIR" -n 2>&1)"
  mk="$(cat "$BUILD_DIR/Makefile")"

  if has_required_flags "$dry_out" || has_required_flags "$mk"; then
    pass "Compilation flags include -Wall -Wextra -Werror"
  else
    fail "invalid compilation flag: missing -Wall/-Wextra/-Werror"
  fi

  if make -C "$BUILD_DIR" >/tmp/minishell_make.log 2>&1; then
    pass "minishell compiles without make errors"
  else
    fail "minishell failed to compile (see /tmp/minishell_make.log)"
    return 1
  fi

  local second
  second="$(make -C "$BUILD_DIR" 2>&1)"
  if [[ "$second" == *"Nothing to be done for 'all'."* || "$second" == *"is up to date."* ]]; then
    pass "Makefile does not re-link on second make"
  elif [[ "$second" == *" -o ${BIN_NAME}"* || "$second" == *" cc "* ]]; then
    fail "Makefile appears to re-link on second make"
  else
    warn "Could not confidently determine re-link behavior"
  fi
}

run_shell_case() {
  local name="$1"
  local input="$2"
  local expected="$3"
  local out="$TMP_DIR/${name// /_}.out"

  printf "%b" "$input" | "$BIN" >"$out" 2>&1

  if grep -Eq "$expected" "$out"; then
    pass "$name"
  else
    fail "$name"
    echo "----- output: $name -----"
    cat "$out"
    echo "--------------------------"
  fi
}

count_globals_quick() {
  info "2) Global variable quick scan"
  local scan_root="$ROOT_DIR"
  [[ -d "$ROOT_DIR/sources" ]] && scan_root="$ROOT_DIR/sources"

  local report="$TMP_DIR/global_report.txt"
  : > "$report"

  while IFS= read -r file; do
    awk '
      /^[[:space:]]*#/ {next}
      /^[[:space:]]*\/\// {next}
      /^[[:space:]]*\/\*/ {next}
      /^[[:space:]]*$/ {next}
      /^[^ \t].*;[ \t]*$/ {
        if ($0 ~ /\(/) next;
        if ($0 ~ /typedef/) next;
        if ($0 ~ /enum[ \t]/) next;
        if ($0 ~ /struct[ \t]/) next;
        print FILENAME ":" NR ":" $0;
      }
    ' "$file" >> "$report"
  done < <(find "$scan_root" -type f \( -name '*.c' -o -name '*.h' \))

  if [[ -s "$report" ]]; then
    warn "Potential globals found (review signal-only rule):"
    cat "$report"
  else
    pass "No obvious global declarations found in quick scan"
  fi
}

run_non_interactive_tests() {
  info "3+) Non-interactive behavior checks"

  run_shell_case "simple command /bin/ls" "/bin/ls\nexit\n" ".+"
  run_shell_case "echo args" "echo hello world\nexit\n" "hello world"
  run_shell_case "echo -n" "echo -n abc\nexit\n" "abc"

  local status
  status="$(printf "exit 123\n" | "$BIN" >/dev/null 2>&1; echo $?)"
  if [[ "$status" == "123" ]]; then
    pass "exit 123 returns status 123"
  else
    fail "exit 123 returned $status (expected 123)"
  fi

  run_shell_case "echo $? form" "echo $?+$?$?\nexit\n" "[0-9]+\+[0-9]+[0-9]+"
  run_shell_case "quotes concat" "echo \"double\"'single''\"123\"'\"'456'\"'\nexit\n" "doublesingle\"123\"'456'"

  local env_out="$TMP_DIR/env_export.out"
  printf "export apple\nenv\nexit\n" | "$BIN" >"$env_out" 2>&1
  if grep -Eq "(^|[[:space:]])apple=" "$env_out"; then
    fail "export apple unexpectedly appears in env"
  else
    pass "export apple does not appear in env"
  fi

  run_shell_case "export apple=" "export apple=\nenv\nexit\n" "apple="

  local unset_out="$TMP_DIR/unset.out"
  printf "export apple=1\nexport orange=2\nunset apple orange pear\nenv\nexit\n" | "$BIN" >"$unset_out" 2>&1
  if grep -Eq "(^|[[:space:]])(apple|orange)=" "$unset_out"; then
    fail "unset did not remove all requested vars"
  else
    pass "unset removed apple and orange"
  fi

  run_shell_case "pwd runs" "pwd\nexit\n" "/"

  mkdir -p "$TMP_DIR/a/b"
  echo "hello from file" > "$TMP_DIR/a/b/file.txt"
  local rel_out="$TMP_DIR/relative.out"
  printf "cd %s\ncat ./a/b/file.txt\nexit\n" "$TMP_DIR" | "$BIN" >"$rel_out" 2>&1
  if grep -q "hello from file" "$rel_out"; then
    pass "relative path read works"
  else
    fail "relative path read failed"
  fi

  local rf="$TMP_DIR/in.txt"
  printf "echo bird > %s\necho grass > %s\ncat < %s\nexit\n" "$rf" "$rf" "$rf" | "$BIN" >"$TMP_DIR/redir_over.out" 2>&1
  if grep -q "grass" "$TMP_DIR/redir_over.out" && ! grep -q "bird" "$TMP_DIR/redir_over.out"; then
    pass "> redirection overwrites"
  else
    fail "> redirection overwrite failed"
  fi

  printf "echo hello > %s\necho world >> %s\ncat < %s\nexit\n" "$rf" "$rf" "$rf" | "$BIN" >"$TMP_DIR/redir_append.out" 2>&1
  if grep -q "hello" "$TMP_DIR/redir_append.out" && grep -q "world" "$TMP_DIR/redir_append.out"; then
    pass ">> redirection appends"
  else
    fail ">> redirection append failed"
  fi

  run_shell_case "redir missing file" "cat < boy\nexit\n" "No such file|no such file"
}

print_manual_signal_todo() {
  info "7) Manual signal tests (interactive)"
  cat <<'EOT'
Run manually in minishell:
  - CTRL-C on empty prompt => new prompt
  - CTRL-\ on empty prompt => no action
  - CTRL-D on empty prompt => exit
  - 'echo cat' then CTRL-C => line cleared
  - 'echo cat' then CTRL-D => should not execute
  - run 'cat' then CTRL-C / CTRL-\ / CTRL-D behaviors
EOT
}

main() {
  resolve_layout || {
    echo
    info "Summary: PASS=$PASS FAIL=$FAIL WARN=$WARN"
    exit 1
  }

  run_make_checks || true

  if [[ ! -x "$BIN" ]]; then
    fail "Cannot run tests: binary not found/executable at '$BIN'"
  else
    count_globals_quick
    run_non_interactive_tests
    print_manual_signal_todo
  fi

  echo
  info "Summary: PASS=$PASS FAIL=$FAIL WARN=$WARN"
  (( FAIL == 0 ))
}

main "$@"

