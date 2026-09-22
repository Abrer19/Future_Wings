import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Toast from './Toast.jsx'

describe('Toast component', () => {
  it('renders nothing inside role=status when message is empty or null', () => {
    const { container } = render(<Toast message={null} />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status).toBeEmptyDOMElement()
  })

  it('displays message when provided', () => {
    render(<Toast message="Profile updated successfully!" />)
    expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
  })
})
