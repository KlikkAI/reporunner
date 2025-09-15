import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Simple test component
const TestComponent: React.FC = () => {
  return <div data-testid="test-component">Testing Setup Works!</div>
}

describe('Testing Setup', () => {
  it('should render test component successfully', () => {
    render(<TestComponent />)
    const element = screen.getByTestId('test-component')
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Testing Setup Works!')
  })

  it('should perform basic arithmetic operations', () => {
    expect(1 + 1).toBe(2)
    expect(10 - 5).toBe(5)
    expect(3 * 4).toBe(12)
    expect(20 / 4).toBe(5)
  })
})
