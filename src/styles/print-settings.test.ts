import { describe, it, expect, vi, afterEach } from 'vitest';

const PRINT_RULES: Array<{ selector: string; rule: string; value: string }> = [
  { selector: '.hc-toggle-btn', rule: 'display', value: 'none' },
  { selector: '.hc-toggle-track', rule: 'display', value: 'none' },
  { selector: '.hc-toggle-thumb', rule: 'display', value: 'none' },
  { selector: '.header', rule: 'display', value: 'none' },
  { selector: '.header-nav', rule: 'display', value: 'none' },
  { selector: '.sr-only', rule: 'display', value: 'none' },
  { selector: '.card', rule: 'background', value: 'none' },
  { selector: '.card-large', rule: 'background', value: 'none' },
  { selector: 'section[aria-labelledby="settings-a11y-heading"]', rule: 'break-inside', value: 'avoid' },
];

function injectPrintStylesheet(): void {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/src/styles/print-settings.css';
  link.id = 'print-settings-test-stylesheet';
  document.head.appendChild(link);
}

function removePrintStylesheet(): void {
  const el = document.getElementById('print-settings-test-stylesheet');
  if (el) {
    el.remove();
  }
}

function setPrintMedia(): () => void {
  const original = window.matchMedia;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === 'print',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  return () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: original });
  };
}

describe('print-settings.css', () => {
  afterEach(() => {
    removePrintStylesheet();
  });

  it('exports a stylesheet that can be loaded into the document', () => {
    injectPrintStylesheet();
    const el = document.getElementById('print-settings-test-stylesheet');
    expect(el).toBeInTheDocument();
    expect(el?.getAttribute('rel')).toBe('stylesheet');
  });

  it('contains rules that hide interactive elements in print media', () => {
    const style = document.createElement('style');
    style.id = 'print-settings-test-inline';
    style.textContent = `@media print {
      .hc-toggle-btn, .hc-toggle-track, .hc-toggle-thumb { display: none !important; }
      .header, .header-nav, .sr-only { display: none !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    expect(sheet.cssRules.length).toBeGreaterThan(0);

    const mediaRule = sheet.cssRules[0] as CSSMediaRule;
    expect(mediaRule.conditionText).toBe('print');

    document.head.removeChild(style);
  });

  it('ensures setting labels remain visible when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-settings-test-labels';
    style.textContent = `@media print {
      .hc-toggle-label { font-size: 11pt; font-weight: 700; color: #000; }
      .hc-toggle-description { font-size: 9.5pt; color: #333; line-height: 1.4; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    const labelRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === '.hc-toggle-label'
    ) as CSSStyleRule;
    expect(labelRule).toBeDefined();
    expect(labelRule.style.cssText).toContain('font-size: 11pt');
    expect(labelRule.style.cssText).toContain('font-weight: 700');

    const descRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === '.hc-toggle-description'
    ) as CSSStyleRule;
    expect(descRule).toBeDefined();
    expect(descRule.style.cssText).toContain('font-size: 9.5pt');
    expect(descRule.style.color).toBe('#333');

    document.head.removeChild(style);
  });

  it('removes card backgrounds and borders when printing', () => {
    const style = document.createElement('style');
    style.id = 'print-settings-test-cards';
    style.textContent = `@media print {
      .card, .card-large { background: none !important; border: none !important; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;
    const cardRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === '.card, .card-large'
    ) as CSSStyleRule;
    expect(cardRule).toBeDefined();
    expect(cardRule.style.background).toBe('none');
    expect(cardRule.style.border).toBe('none');

    document.head.removeChild(style);
  });

  it('applies accessible print colours against white paper', () => {
    const style = document.createElement('style');
    style.id = 'print-settings-test-colors';
    style.textContent = `@media print {
      body { background: #fff !important; color: #000 !important; }
      .hc-toggle-label { color: #000; }
      .hc-toggle-description { color: #333; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    const bodyRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === 'body'
    ) as CSSStyleRule;
    expect(bodyRule).toBeDefined();
    expect(bodyRule.style.color).toBe('#000');

    document.head.removeChild(style);
  });

  it('uses break-inside: avoid on settings section for print continuity', () => {
    const style = document.createElement('style');
    style.id = 'print-settings-test-break';
    style.textContent = `@media print {
      section[aria-labelledby="settings-a11y-heading"] { break-inside: avoid; }
    }`;
    document.head.appendChild(style);

    const sheet = style.sheet as CSSStyleSheet;
    const mediaRule = sheet.cssRules[0] as CSSMediaRule;

    const sectionRule = Array.from(mediaRule.cssRules).find(
      (r) => r instanceof CSSStyleRule && (r as CSSStyleRule).selectorText === 'section[aria-labelledby="settings-a11y-heading"]'
    ) as CSSStyleRule;
    expect(sectionRule).toBeDefined();
    expect(sectionRule.style.cssText).toContain('break-inside: avoid');

    document.head.removeChild(style);
  });
});
