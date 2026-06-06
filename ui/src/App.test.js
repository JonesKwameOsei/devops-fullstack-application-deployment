import { render, screen } from '@testing-library/react';
import App from './App';

test('renders navbar logo', () => {
  render(<App />);
  const logoText = screen.getByText('Mighty Hands 💪 Book Shop');
  expect(logoText).toBeInTheDocument();
});
