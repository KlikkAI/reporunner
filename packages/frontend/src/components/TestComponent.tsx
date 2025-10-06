// Test React component for source mapping validation
import React from 'react';

export const TestComponent: React.FC = () => {
  const handleClick = () => {
    console.log('Button clicked');
  };

  return (
    <div>
      <h1>Test Component</h1>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};
