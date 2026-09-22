import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import StatCard from './StatCard.jsx'

describe('StatCard component', () => {
  it('renders label, value, and hint text correctly', () => {
    render(<StatCard tone="active" label="Pending Tasks" value={5} hint="Due this week" />)

    expect(screen.getByText('Pending Tasks')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Due this week')).toBeInTheDocument()
  })

  it('renders properly when value is 0 (muted state)', () => {
    render(<StatCard tone="completed" label="Finished" value={0} hint="No items yet" />)

    expect(screen.getByText('Finished')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
