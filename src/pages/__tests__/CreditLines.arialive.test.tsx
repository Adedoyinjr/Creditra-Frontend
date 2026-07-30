import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import CreditLines from '../CreditLines';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function renderPage() {
  const result = render(
    <BrowserRouter>
      <CreditLines defaultLoading={false} />
    </BrowserRouter>
  );
  act(() => {
    vi.advanceTimersByTime(500);
  });
  return result;
}

describe('CreditLines LiveRegion Announcements', () => {
  it('announces state changes on freeze and unfreeze via aria-live region', async () => {
    renderPage();
    
    // Find the live region component
    const liveRegion = document.getElementById('cl-live-region');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion?.textContent).toBe('');
    
    // The mock data has a line named 'Primary Business Line'
    // The menu is a button containing MoreHorizontal.
    // The simplest way to open the menu is to find all menu buttons and click the first one
    const menuButtons = screen.getAllByRole('button', { name: /Menu for Primary Business Line/i });
    if (menuButtons.length > 0) {
      act(() => {
        fireEvent.click(menuButtons[0]);
      });
    }
    
    // The menu renders Freeze/Unfreeze button
    const freezeButton = screen.getAllByRole('menuitem', { name: /freeze/i })[0];
    expect(freezeButton).toBeInTheDocument();
    
    act(() => {
      fireEvent.click(freezeButton);
    });
    
    // After clicking Freeze, the line becomes frozen, and LiveRegion is updated
    expect(liveRegion?.textContent).toBe('Credit line Primary Business Line frozen.');
    
    // Let's open the menu again
    act(() => {
      fireEvent.click(menuButtons[0]);
    });
    
    // Now the button should say Unfreeze
    const unfreezeButton = screen.getAllByRole('menuitem', { name: /unfreeze/i })[0];
    expect(unfreezeButton).toBeInTheDocument();
    
    act(() => {
      fireEvent.click(unfreezeButton);
    });
    
    expect(liveRegion?.textContent).toBe('Credit line Primary Business Line unfrozen.');
  });
});
