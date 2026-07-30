import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { AttestationCard } from './AttestationCard';

function renderCard(props: React.ComponentProps<typeof AttestationCard>) {
  return render(
    <MemoryRouter>
      <AttestationCard {...props} />
    </MemoryRouter>,
  );
}

describe('AttestationCard', () => {
  it('renders title and description', () => {
    renderCard({
      title: 'Identity Verified',
      description: 'Your KYC attestation is complete.',
    });
    expect(screen.getByText('Identity Verified')).toBeInTheDocument();
    expect(
      screen.getByText('Your KYC attestation is complete.'),
    ).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    renderCard({
      title: 'Attestation',
      description: 'Details.',
      breadcrumbs: [{ label: 'Home', to: '/' }, { label: 'Attest' }],
    });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Attest')).toBeInTheDocument();
  });

  it('does not render breadcrumb nav when no breadcrumbs', () => {
    renderCard({
      title: 'Test',
      description: 'No crumbs.',
    });
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('has accessible heading', () => {
    renderCard({ title: 'Test', description: 'Body' });
    expect(
      screen.getByRole('heading', { name: 'Test' }),
    ).toBeInTheDocument();
  });
});
