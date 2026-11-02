import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Toast from './Toast.jsx'

describe('Toast component', () => {
  it('renders nothing inside role=status when message is empty or null', () => {
    render(<Toast message={null} />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status).toBeEmptyDOMElement()
  })

  it('displays message when provided', () => {
    render(<Toast message="Profile updated successfully!" />)
    expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
  })

  it('renders optional action button when actionLabel and onAction are passed', () => {
    const onAction = () => {}
    render(<Toast message="Added to Application Tracker" actionLabel="View Tracker" onAction={onAction} />)
    expect(screen.getByText('Added to Application Tracker')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View Tracker' })).toBeInTheDocument()
  })
})
