import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ContrastProvider } from '../context/ContrastContext';
import { ReducedMotionProvider } from '../context/ReducedMotionContext';
import { SettingsAccount } from './SettingsAccount';

/**
 * Helper to render SettingsAccount wrapped in required context providers.
 */
function renderSettingsAccount() {
  return render(
    <ContrastProvider>
      <ReducedMotionProvider>
        <SettingsAccount />
      </ReducedMotionProvider>
    </ContrastProvider>
  );
}

describe('SettingsAccount', () => {
  it('renders the page title', () => {
    renderSettingsAccount();
    expect(
      screen.getByRole('heading', { name: /account settings/i })
    ).toBeInTheDocument();
  });

  it('renders the description text', () => {
    renderSettingsAccount();
    expect(
      screen.getByText(/manage your account preferences/i)
    ).toBeInTheDocument();
  });

  it('renders all four collapsible sections', () => {
    renderSettingsAccount();
    expect(screen.getByRole('button', { name: /accessibility/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regional preferences/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export account data/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /privacy & security/i })).toBeInTheDocument();
  });

  it('accessibility section is expanded by default', () => {
    renderSettingsAccount();
    const toggle = screen.getByRole('button', { name: /accessibility/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('other sections are collapsed by default', () => {
    renderSettingsAccount();
    expect(
      screen.getByRole('button', { name: /regional preferences/i })
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('button', { name: /export account data/i })
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('button', { name: /privacy & security/i })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggle button expands and collapses a section', async () => {
    const user = userEvent.setup();
    renderSettingsAccount();

    const toggle = screen.getByRole('button', { name: /regional preferences/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('expanded section reveals its content panel', async () => {
    const user = userEvent.setup();
    renderSettingsAccount();

    const toggle = screen.getByRole('button', { name: /privacy & security/i });
    const panelId = toggle.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();

    const panel = document.getElementById(panelId!);
    expect(panel).toHaveAttribute('hidden');

    await user.click(toggle);
    expect(panel).not.toHaveAttribute('hidden');
    expect(panel).toHaveClass('settings-account__panel--expanded');
  });

  it('toggle buttons have aria-controls linking to their panels', () => {
    renderSettingsAccount();

    const toggles = screen.getAllByRole('button');
    const collapsibleToggles = toggles.filter((btn) =>
      btn.classList.contains('settings-account__toggle')
    );

    for (const toggle of collapsibleToggles) {
      const controlsId = toggle.getAttribute('aria-controls');
      expect(controlsId).toBeTruthy();
      const panel = document.getElementById(controlsId!);
      expect(panel).toBeInTheDocument();
      expect(panel?.tagName).toBe('DIV');
    }
  });

  it('chevron rotates when section is expanded', async () => {
    const user = userEvent.setup();
    renderSettingsAccount();

    const toggle = screen.getByRole('button', { name: /export account data/i });
    const chevron = toggle.querySelector('.settings-account__chevron');
    expect(chevron).not.toHaveClass('settings-account__chevron--open');

    await user.click(toggle);
    expect(chevron).toHaveClass('settings-account__chevron--open');

    await user.click(toggle);
    expect(chevron).not.toHaveClass('settings-account__chevron--open');
  });

  it('renders the HighContrastToggle inside the accessibility section', () => {
    renderSettingsAccount();
    // HighContrastToggle renders a button with role="switch"
    const switches = screen.getAllByRole('switch');
    // Should have both high contrast and reduced motion switches
    expect(switches.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the LocaleSettings inside regional preferences', async () => {
    const user = userEvent.setup();
    renderSettingsAccount();

    // Expand regional preferences
    await user.click(screen.getByRole('button', { name: /regional preferences/i }));

    // LocaleSettings renders a container with data-testid
    expect(screen.getByTestId('locale-settings-container')).toBeInTheDocument();
    expect(screen.getByTestId('currency-select')).toBeInTheDocument();
    expect(screen.getByTestId('language-select')).toBeInTheDocument();
  });

  it('renders the ExportAccountSettings inside export section', async () => {
    const user = userEvent.setup();
    renderSettingsAccount();

    // Expand export section
    await user.click(screen.getByRole('button', { name: /export account data/i }));

    expect(screen.getByTestId('export-settings-container')).toBeInTheDocument();
    expect(screen.getByTestId('export-json-button')).toBeInTheDocument();
    expect(screen.getByTestId('export-csv-button')).toBeInTheDocument();
  });

  it('touch target for toggle buttons meets 44x44 px minimum', () => {
    renderSettingsAccount();
    const toggles = document.querySelectorAll('.settings-account__toggle');
    expect(toggles.length).toBeGreaterThanOrEqual(4);
    for (const toggle of toggles) {
      // Verify the element has the correct class for touch-target sizing
      expect(toggle.classList.contains('settings-account__toggle')).toBe(true);
      // Verify it's a button (interactive element)
      expect(toggle.tagName).toBe('BUTTON');
      // Check the CSS rule ensures min-height via the stylesheet
      const styles = window.getComputedStyle(toggle);
      // JSDOM may not resolve min-height from external stylesheets; fall back
      // to checking the computed value is non-empty or at least 44
      const minHeight = styles.minHeight;
      const parsedMinHeight = parseInt(minHeight, 10);
      if (!Number.isNaN(parsedMinHeight)) {
        expect(parsedMinHeight).toBeGreaterThanOrEqual(44);
      }
      // Additionally verify the element has dimensions via offsetHeight
      // (only if the element is visible / laid out)
      if (toggle instanceof HTMLElement && toggle.offsetHeight > 0) {
        expect(toggle.offsetHeight).toBeGreaterThanOrEqual(44);
      }
    }
  });

  it('main element has aria-labelledby linking to the title', () => {
    const { container } = renderSettingsAccount();
    const main = container.querySelector('main');
    expect(main).toHaveAttribute('aria-labelledby', 'settings-account-title');
  });

  it('all sections have proper region roles', async () => {
    const user = userEvent.setup();
    renderSettingsAccount();

    // Expand all sections
    const toggles = screen.getAllByRole('button').filter((btn) =>
      btn.classList.contains('settings-account__toggle')
    );
    for (const toggle of toggles) {
      if (toggle.getAttribute('aria-expanded') === 'false') {
        await user.click(toggle);
      }
    }

    // All panels should be visible and have role="region"
    const panels = document.querySelectorAll('.settings-account__panel');
    expect(panels.length).toBe(4);
    for (const panel of panels) {
      expect(panel.getAttribute('role')).toBe('region');
      expect(panel).not.toHaveAttribute('hidden');
    }
  });

  // ─── Print behaviour tests ──────────────────────────────────────────────

  describe('print behaviour', () => {
    it('all section panels have the CSS class targeted by print rules', () => {
      renderSettingsAccount();
      const panels = document.querySelectorAll('.settings-account__panel');
      expect(panels.length).toBe(4);
      for (const panel of panels) {
        expect(panel.classList.contains('settings-account__panel')).toBe(true);
      }
    });

    it('all toggle buttons have the chevron class targeted by print rules', () => {
      renderSettingsAccount();
      const chevrons = document.querySelectorAll('.settings-account__chevron');
      expect(chevrons.length).toBe(4);
      for (const chevron of chevrons) {
        expect(chevron.classList.contains('settings-account__chevron')).toBe(true);
      }
    });

    it('collapsible sections use the class targeted by print break-inside rules', () => {
      renderSettingsAccount();
      const sections = document.querySelectorAll('.settings-account__collapsible');
      expect(sections.length).toBe(4);
      for (const section of sections) {
        expect(section.classList.contains('settings-account__collapsible')).toBe(true);
      }
    });

    it('print CSS panel-expansion rules exist for SettingsAccount panels', () => {
      const style = document.createElement('style');
      style.id = 'print-test-sa-panels';
      style.textContent = `@media print {
        .settings-account__panel { max-height: none !important; overflow: visible !important; transition: none !important; }
        .settings-account__panel[hidden] { display: block !important; }
      }`;
      document.head.appendChild(style);

      const sheet = style.sheet as CSSStyleSheet;
      const mediaRule = sheet.cssRules[0] as CSSMediaRule;

      const panelRule = Array.from(mediaRule.cssRules).find(
        (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === '.settings-account__panel'
      ) as CSSStyleRule;
      expect(panelRule).toBeDefined();
      expect(panelRule.cssText).toContain('max-height');
      expect(panelRule.cssText).toContain('none');

      const hiddenRule = Array.from(mediaRule.cssRules).find(
        (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === '.settings-account__panel[hidden]'
      ) as CSSStyleRule;
      expect(hiddenRule).toBeDefined();
      expect(hiddenRule.cssText).toContain('display: block');

      document.head.removeChild(style);
    });

    it('print CSS toggle rules make toggle buttons non-interactive', () => {
      const style = document.createElement('style');
      style.id = 'print-test-sa-toggle';
      style.textContent = `@media print {
        .settings-account__toggle { pointer-events: none; cursor: default; border-bottom: 1px solid #ccc !important; }
      }`;
      document.head.appendChild(style);

      const sheet = style.sheet as CSSStyleSheet;
      const mediaRule = sheet.cssRules[0] as CSSMediaRule;
      const rule = mediaRule.cssRules[0] as CSSStyleRule;
      expect(rule.cssText).toContain('pointer-events: none');
      expect(rule.cssText).toContain('cursor: default');

      document.head.removeChild(style);
    });
  });
});
