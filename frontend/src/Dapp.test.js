import { render, screen } from '@testing-library/react';
import { Dapp } from './Dapp';

test('renders auction page', () => {
  render(<Dapp />);
  const linkElement = screen.getByText(/Auction/i);
  expect(linkElement).toBeInTheDocument();
});
