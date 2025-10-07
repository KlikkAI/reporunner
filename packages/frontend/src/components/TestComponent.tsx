// Test React component for source mapping validation
import type React from 'react';

export const TestComponent: React.FC = () => {
  const handleClick = () => {};

  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};
