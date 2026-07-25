import { render, screen } from '@testing-library/react';
import { KbdHint } from './KbdHint';

describe('KbdHint', () => {
  it('renders keys correctly', () => {
    render(<KbdHint keys={['⌘', 'K']} />);
    
    expect(screen.getByText('⌘')).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();
  });

  it('renders single key without separator', () => {
    render(<KbdHint keys={['C']} />);
    
    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('renders description in title and aria-label', () => {
    render(<KbdHint keys={['Shift', 'C']} description="Compare" />);
    
    const wrapper = screen.getByTitle('Compare');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveAttribute('aria-label', 'Compare: Shift then C');
  });

  it('does not render if keys are empty', () => {
    const { container } = render(<KbdHint keys={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
