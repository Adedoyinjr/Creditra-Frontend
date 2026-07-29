import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { SmartPayCTA } from './SmartPayCTA';
import { Link } from 'react-router-dom';

describe('SmartPayCTA', () => {
  it('renders title, description, and CTA', () => {
    render(
      <MemoryRouter>
        <SmartPayCTA
          title="Try Smart Pay"
          description="Auto-repay on your terms."
          cta={<Link to="/autopay">Set up</Link>}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'Try Smart Pay' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Auto-repay on your terms.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Set up' }),
    ).toBeInTheDocument();
  });

  it('renders responsive picture when images are provided', () => {
    render(
      <SmartPayCTA
        title="CTA"
        description="Desc."
        cta={<button>Go</button>}
        images={[
          { src: '/mobile.png', width: 480 },
          { src: '/desktop.png', width: 1024 },
        ]}
        imageAlt="Illustration"
      />,
    );
    const img = screen.getByAltText('Illustration');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/desktop.png');

    const sources = document.querySelectorAll('source');
    expect(sources.length).toBe(2);
  });

  it('omits image section when no images are provided', () => {
    render(
      <SmartPayCTA
        title="No Image"
        description="No picture here."
        cta={<button>Ok</button>}
      />,
    );
    expect(document.querySelector('picture')).not.toBeInTheDocument();
  });
});
