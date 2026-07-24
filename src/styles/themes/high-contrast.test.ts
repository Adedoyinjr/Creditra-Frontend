import './high-contrast.css';

test('high‑contrast CSS variables have expected values', () => {
  // Simulate the attribute
  document.documentElement.setAttribute('data-contrast', 'high');
  const styles = getComputedStyle(document.documentElement);
  expect(styles.getPropertyValue('--bg').trim()).toBe('#000000');
  expect(styles.getPropertyValue('--border').trim()).toBe('#ffffff');
  expect(styles.getPropertyValue('--text').trim()).toBe('#ffffff');
  expect(styles.getPropertyValue('--muted').trim()).toBe('#d4d4d4');
  expect(styles.getPropertyValue('--accent').trim()).toBe('#7dd3fc');
  expect(styles.getPropertyValue('--success').trim()).toBe('#86efac');
  expect(styles.getPropertyValue('--warning').trim()).toBe('#fde047');
  expect(styles.getPropertyValue('--error').trim()).toBe('#fca5a5');
});
