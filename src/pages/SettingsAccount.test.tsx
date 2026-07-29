import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsAccount } from './SettingsAccount';

describe('SettingsAccount', () => {
  it('renders the heading and children', () => {
    render(
      <SettingsAccount>
        <button>Change password</button>
      </SettingsAccount>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Account Settings' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Change password' }),
    ).toBeInTheDocument();
  });

  it('uses main landmark with aria-labelledby', () => {
    const { container } = render(
      <SettingsAccount>
        <span>Content</span>
      </SettingsAccount>,
    );
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('aria-labelledby', 'settings-account-heading');
  });
});
