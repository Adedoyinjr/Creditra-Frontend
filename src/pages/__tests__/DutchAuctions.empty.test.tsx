import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { DutchAuction } from '../../types/dutchAuction';

// Local mock — mutable per test via the hoisted holder, same pattern as
// RepayPage.empty.test.tsx. The populated data module is never loaded.
const auctionData = vi.hoisted(() => ({ value: [] as unknown[] }));
vi.mock('@/data/mockDutchAuctions', () => ({
  get MOCK_DUTCH_AUCTIONS() {
    return auctionData.value;
  },
}));

import { DutchAuctions } from '../DutchAuctions';

const now = Date.now();

function activeAuction(id: string): DutchAuction {
  return {
    id,
    nft: {
      id: `NFT-${id}`,
      name: `Test NFT ${id}`,
      description: 'Test auction fixture',
      image: 'https://example.test/nft.png',
      collection: 'Test Collection',
      tokenId: '1',
    },
    seller: 'GTEST...SELLER',
    startPrice: 1000,
    floorPrice: 100,
    startTime: new Date(now - 3_600_000).toISOString(),
    endTime: new Date(now + 3_600_000).toISOString(),
    duration: 7200,
    status: 'Active',
  };
}

/**
 * Issue #515 — themed empty state on the Dutch auctions page.
 *
 * - with no auctions at all, the shared `<EmptyState />` renders with the
 *   NoDataGraph illustration and no CTA (there is nothing to un-filter)
 * - with auctions that a filter excludes, the description points at the
 *   filter and the primary CTA switches back to "all"
 * - the region announces via role="status" (from EmptyState)
 */
describe('DutchAuctions empty state (issue #515)', () => {
  beforeEach(() => {
    auctionData.value = [];
  });

  it('renders the themed empty state when no auctions exist', () => {
    render(<DutchAuctions />);
    const region = screen.getByTestId('auctions-empty-state');
    expect(region).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'No auctions right now' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show all auctions' }),
    ).not.toBeInTheDocument();
  });

  it('exposes the empty-state region with role=status', () => {
    render(<DutchAuctions />);
    expect(screen.getByRole('status')).toBe(
      screen.getByTestId('auctions-empty-state'),
    );
  });

  it('renders the decorative illustration', () => {
    const { container } = render(<DutchAuctions />);
    const illustration = container.querySelector('.empty-state-illustration');
    expect(illustration).not.toBeNull();
    expect(illustration?.getAttribute('aria-hidden')).toBe('true');
  });

  it('offers a Show all auctions CTA when a filter excludes everything', () => {
    auctionData.value = [activeAuction('DA-1')];
    render(<DutchAuctions />);

    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    expect(
      screen.getByRole('heading', { name: 'No completed auctions' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show all auctions' }));
    expect(screen.queryByTestId('auctions-empty-state')).not.toBeInTheDocument();
    expect(screen.getByText('Test NFT DA-1')).toBeInTheDocument();
  });

  it('keeps rendering auction cards when auctions match the filter', () => {
    auctionData.value = [activeAuction('DA-1'), activeAuction('DA-2')];
    render(<DutchAuctions />);
    expect(screen.queryByTestId('auctions-empty-state')).not.toBeInTheDocument();
    expect(screen.getByText('Test NFT DA-1')).toBeInTheDocument();
    expect(screen.getByText('Test NFT DA-2')).toBeInTheDocument();
  });
});
