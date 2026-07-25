# Button Order in Modals and Multi-Step Flows

> Rule: **Cancel → Back → Primary** (left to right)

Every modal footer and wizard action bar in this codebase follows a single consistent
button order. This document is the canonical reference for that rule.

---

## The rule

```
[ Cancel ]  [ Back ]  [ Primary / Confirm ]
  leftmost              rightmost
```

| Slot | Role | When present |
|------|------|--------------|
| **Cancel** | Exits the flow entirely. No changes are persisted. | Always, except success / single-CTA states |
| **Back** | Returns to the previous step. Progress is preserved. | Multi-step flows only (step 2+) |
| **Primary** | Advances the flow or triggers the irreversible action. | Always |

On mobile (`< sm`) the column is **reversed** with `flex-col-reverse` so the primary
action stacks on top — closest to the user's thumb — while Cancel falls to the bottom
where it is harder to hit accidentally.

---

## Rationale

### Spatial consistency (WCAG 3.2.4 Consistent Identification)
Users build muscle memory for where the primary action lives. Anchoring it to the
trailing (right / bottom) edge means the confirmation button is always in the same
relative position regardless of how many secondary actions are present.

### Destructive-safe separation
Cancel and Back are the "safe" exits. Placing them on the leading edge (left / top of
stack on mobile) puts physical distance between them and the irreversible action. The
further apart two targets are, the less likely a single pointer gesture will hit both.
This is an application of Fitts's Law to error prevention.

### Back ≠ Cancel
Back and Cancel are *not* the same action:

| Action | Effect |
|--------|--------|
| **Cancel** | Closes the modal. Any in-progress state is discarded. |
| **Back** | Returns to the previous step. Selection and input are preserved. |

Placing Back *between* Cancel and the primary reinforces this distinction spatially:
Back is a mid-flow action, not an exit.

### Thumb reach on mobile
On phones held one-handed, the bottom-right of the screen is the easiest target.
`flex-col-reverse` maps the primary action to that position while pushing Cancel to
the top of the stack (hardest to tap accidentally).

---

## Affected components

| Component | Steps that have Cancel + Back | Notes |
|-----------|------------------------------|-------|
| `CollateralSubstitutionModal` | Review, Confirm | Previously: Back → Cancel → Primary; corrected to Cancel → Back → Primary |
| `ConfirmationStep` (draw wizard) | Step 4 | Previously: Cancel → Back → Primary; order was already correct, comment added |
| `TypedAmountConfirm` | Single step | Cancel ← → Confirm; no Back needed |
| `RepayModal` | Review step | Back ← → Confirm; no Cancel button in that row (modal-level `✕` serves as cancel) |

---

## Implementation checklist for new modals

When adding a new modal or multi-step wizard footer, copy this template:

```tsx
{/* Button order: Cancel (exit) — Back (prev step) — Primary (confirm)
    See docs/BUTTON_ORDER.md */}
<div className="modal-footer">
  {/* Cancel: always leftmost */}
  <button type="button" onClick={onCancel} disabled={isPending}>
    Cancel
  </button>

  {/* Back: only in multi-step flows, step 2+ */}
  {showBack && (
    <button type="button" onClick={onBack} disabled={isPending}>
      Back
    </button>
  )}

  {/* Primary: always rightmost */}
  <PendingButton
    pending={isPending}
    pendingLabel="Processing…"
    onClick={onConfirm}
    disabled={isPrimaryDisabled}
  >
    Confirm
  </PendingButton>
</div>
```

For Tailwind-based components use `flex-col-reverse` on mobile:

```tsx
<div className="flex flex-col-reverse gap-3 sm:flex-row">
  <button type="button" onClick={onCancel}>Cancel</button>
  {showBack && <button type="button" onClick={onBack}>Back</button>}
  <PendingButton onClick={onConfirm}>Confirm</PendingButton>
</div>
```

---

## Dark-mode and design token consistency

Button variants are token-driven. Do not hard-code colours in button elements.

| Variant | CSS class / token | Use for |
|---------|-------------------|---------|
| Ghost / outline | `csm-btn--ghost` or `border-border` classes | Cancel, Back |
| Primary | `csm-btn--primary` or `bg-blue-600` | Forward / confirm action |
| Danger | `btn.danger` (inline token) | Destructive confirmation only |

All buttons maintain a `44 × 44 px` minimum touch target (WCAG 2.5.5).

---

## Testing expectations

Every modal with a Cancel + Back + Primary footer **must** have a test that asserts the
DOM order of those buttons:

```ts
it('renders buttons in Cancel → Back → Primary order', () => {
  render(<MyModal ... />);

  const buttons = screen.getAllByRole('button').filter(
    (btn) => !btn.getAttribute('aria-label')?.toLowerCase().includes('close'),
  );

  // Indices depend on the step, but the relative order is fixed:
  // the Cancel button must appear before Back, and Back before the primary.
  const cancelIdx = buttons.findIndex((b) => b.textContent?.trim() === 'Cancel');
  const backIdx   = buttons.findIndex((b) => b.textContent?.trim() === 'Back');
  const primaryIdx = buttons.findIndex((b) => /confirm|draw|continue|review/i.test(b.textContent ?? ''));

  expect(cancelIdx).toBeLessThan(backIdx);
  expect(backIdx).toBeLessThan(primaryIdx);
});
```

See `src/components/CollateralSubstitutionModal.test.tsx` and
`src/components/ConfirmationStep.test.tsx` for working examples.
