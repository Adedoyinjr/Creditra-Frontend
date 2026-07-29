#!/usr/bin/env bash
set -euo pipefail

# open_pr.sh
# ──────────
# Helper script to open a PR for the Creditra-Frontend repo.
#
# Usage:
#   ./scripts/open_pr.sh "PR title" "PR body (optional)"
#
# Requires:
#   - gh CLI (GitHub CLI) installed and authenticated
#   - A branch with committed changes pushed to origin

TITLE="${1:-}"
BODY="${2:-}"

if [ -z "$TITLE" ]; then
  echo "Usage: $0 <title> [body]"
  exit 1
fi

# Default body if none provided
DEFAULT_BODY=$(cat <<'EOF'
## Summary
<!-- Describe your changes -->

## Accessibility Checklist
- [ ] Keyboard navigation works (Tab, Shift+Tab, Enter, Escape)
- [ ] Focus indicators are clearly visible (2px outline, 2px offset)
- [ ] Contrast ratios meet WCAG AA (4.5:1 text, 3:1 large text/icons)
- [ ] Touch targets are at least 44×44 px
- [ ] Semantic HTML and ARIA roles/labels are used
- [ ] `prefers-reduced-motion` is respected
EOF
)

FINAL_BODY="${BODY:-$DEFAULT_BODY}"

echo "Opening PR..."
gh pr create \
  --title "$TITLE" \
  --body "$FINAL_BODY" \
  --base main

echo "PR opened successfully."
