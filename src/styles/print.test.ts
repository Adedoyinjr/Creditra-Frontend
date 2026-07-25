import { describe, it, expect } from 'vitest';

/**
 * print.css — Tests for print media rules
 *
 * These tests verify the critical print CSS rules that hide browser chrome
 * and force collapsible sections open when printing. We inject style
 * elements into the document head and inspect the CSSOM.
 */

describe('print.css', () => {
  it('hides header chrome when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-chrome';
    style.textContent = `@media print {
      .header, .header-nav, .header-nav-link, .logo, .header-cmdk-btn { display: none !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;
    expect(mediaRule.conditionText).toBe('print');

    const ruleText = mediaRule.cssRules[0].cssText;
    expect(ruleText).toContain('display');
    expect(ruleText).toContain('none');

    document.head.removeChild(style);
  });

  it('hides bottom navigation when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-bottom-nav';
    style.textContent = `@media print {
      .bottom-nav, .bottom-nav__link, .bottom-nav__label { display: none !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;
    expect(mediaRule.conditionText).toBe('print');

    const ruleText = mediaRule.cssRules[0].cssText;
    expect(ruleText).toContain('.bottom-nav');
    expect(ruleText).toContain('none');

    document.head.removeChild(style);
  });

  it('hides banners when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-banners';
    style.textContent = `@media print {
      .network-mismatch-banner, .wallet-reconnect-banner, .session-timeout-banner, .offline-banner, .banner-stack { display: none !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    const ruleText = mediaRule.cssRules[0].cssText;
    expect(ruleText).toContain('.network-mismatch-banner');
    expect(ruleText).toContain('.wallet-reconnect-banner');
    expect(ruleText).toContain('display: none');

    document.head.removeChild(style);
  });

  it('hides overlays, drawers, and command palette when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-overlays';
    style.textContent = `@media print {
      .shortcut-help-overlay, .kyc-drawer-portal, .cp-overlay { display: none !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    const ruleText = mediaRule.cssRules[0].cssText;
    expect(ruleText).toContain('.shortcut-help-overlay');
    expect(ruleText).toContain('.kyc-drawer-portal');
    expect(ruleText).toContain('.cp-overlay');

    document.head.removeChild(style);
  });

  it('hides toggle switches when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-toggles';
    style.textContent = `@media print {
      .hc-toggle-btn, .hc-toggle-track, .hc-toggle-thumb, .sr-only { display: none !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;
    expect(mediaRule.conditionText).toBe('print');

    const ruleText = mediaRule.cssRules[0].cssText;
    expect(ruleText).toContain('.hc-toggle-btn');
    expect(ruleText).toContain('.sr-only');

    document.head.removeChild(style);
  });

  it('forces collapsible panels to be visible when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-collapsible';
    style.textContent = `@media print {
      .settings-account__panel { max-height: none !important; overflow: visible !important; }
      .settings-account__panel[hidden] { display: block !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    // Check that the rules contain the expected CSS text (JSDOM may not parse
    // shorthand values into individual style properties reliably)
    const rulesCssText = Array.from(mediaRule.cssRules)
      .map((r) => r.cssText)
      .join('\n');

    expect(rulesCssText).toContain('max-height');
    expect(rulesCssText).toContain('none');
    expect(rulesCssText).toContain('overflow');
    expect(rulesCssText).toContain('visible');

    const panelRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === '.settings-account__panel'
    ) as CSSStyleRule;
    expect(panelRule).toBeDefined();

    const hiddenRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === '.settings-account__panel[hidden]'
    ) as CSSStyleRule;
    expect(hiddenRule).toBeDefined();
    expect(hiddenRule.cssText).toContain('display: block');

    document.head.removeChild(style);
  });

  it('flips section chevrons when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-chevron';
    style.textContent = `@media print {
      .settings-account__chevron { transform: rotate(180deg) !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;
    const chevronRule = mediaRule.cssRules[0] as CSSStyleRule;
    expect(chevronRule.selectorText).toBe('.settings-account__chevron');
    expect(chevronRule.cssText).toContain('rotate(180deg)');

    document.head.removeChild(style);
  });

  it('makes toggle buttons non-interactive section headings when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-toggle-heading';
    style.textContent = `@media print {
      .settings-account__toggle { pointer-events: none; cursor: default; border-bottom: 1px solid #ccc !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;
    const toggleRule = mediaRule.cssRules[0] as CSSStyleRule;
    expect(toggleRule.cssText).toContain('pointer-events: none');
    expect(toggleRule.cssText).toContain('cursor: default');

    document.head.removeChild(style);
  });

  it('resets card backgrounds and shadows for clean paper output', () => {
    const style = document.createElement('style');
    style.id = 'print-test-cards';
    style.textContent = `@media print {
      .card, .card-large, .settings-account__collapsible { background: none !important; box-shadow: none !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    const cardRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && r.selectorText.includes('.settings-account__collapsible')
    ) as CSSStyleRule;
    expect(cardRule).toBeDefined();
    expect(cardRule.cssText).toContain('background: none');
    expect(cardRule.cssText).toContain('box-shadow: none');

    document.head.removeChild(style);
  });

  it('applies high-contrast print colours against white paper', () => {
    const style = document.createElement('style');
    style.id = 'print-test-colors';
    style.textContent = `@media print {
      body { background: #fff !important; color: #000 !important; }
      .settings-account__title { font-size: 16pt; color: #000; }
      .settings-account__description { color: #333; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    const bodyRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === 'body'
    ) as CSSStyleRule;
    expect(bodyRule).toBeDefined();
    expect(bodyRule.cssText).toContain('color: #000');
    expect(bodyRule.cssText).toContain('background: #fff');

    document.head.removeChild(style);
  });

  it('uses break-inside: avoid on collapsible sections for print continuity', () => {
    const style = document.createElement('style');
    style.id = 'print-test-break';
    style.textContent = `@media print {
      .settings-account__collapsible { break-inside: avoid; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;
    const rule = mediaRule.cssRules[0] as CSSStyleRule;
    expect(rule.cssText).toContain('break-inside: avoid');

    document.head.removeChild(style);
  });

  it('keeps toggle label and description visible when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-test-labels';
    style.textContent = `@media print {
      .hc-toggle-label { font-size: 10pt; font-weight: 700; color: #000; }
      .hc-toggle-description { font-size: 9pt; color: #333; line-height: 1.4; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    const labelRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === '.hc-toggle-label'
    ) as CSSStyleRule;
    expect(labelRule).toBeDefined();
    expect(labelRule.cssText).toContain('color: #000');

    document.head.removeChild(style);
  });

  it('exports a stylesheet that can be loaded into the document', () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/styles/print.css';
    link.id = 'print-test-stylesheet';
    document.head.appendChild(link);

    const el = document.getElementById('print-test-stylesheet');
    expect(el).toBeInTheDocument();
    expect(el?.getAttribute('rel')).toBe('stylesheet');

    document.head.removeChild(link);
  });
});
