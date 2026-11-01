import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ReviewCard from './ReviewCard.jsx'

describe('ReviewCard XSS safety and rendering', () => {
  it('renders script tags as plain text without executing or injecting script DOM elements', () => {
    const maliciousComment = '<script>alert(1)</script>'
    const { container } = render(
      <ReviewCard
        review={{
          id: 1,
          reviewerName: 'Jane Doe',
          comment: maliciousComment,
          score: 5,
          isMine: false,
        }}
      />
    )

    // Verify no <script> DOM element exists
    expect(container.querySelector('script')).toBeNull()

    // Verify the text content matches the literal string safely escaped by React
    const commentEl = screen.getByTestId('review-comment')
    expect(commentEl).toBeInTheDocument()
    expect(commentEl.textContent).toBe(maliciousComment)
    expect(screen.getByText(maliciousComment)).toBeInTheDocument()
  })

  it('renders HTML markup like img onerror tags as safe text nodes', () => {
    const maliciousPayload = '<img src=x onerror=alert("xss") />'
    const { container } = render(
      <ReviewCard
        review={{
          id: 2,
          reviewerName: 'Security Auditor',
          comment: maliciousPayload,
          score: 4,
          isMine: true,
        }}
      />
    )

    // Verify no <img> DOM element exists
    expect(container.querySelector('img')).toBeNull()

    // Verify the text content is rendered literally
    const commentEl = screen.getByTestId('review-comment')
    expect(commentEl.textContent).toBe(maliciousPayload)
    expect(screen.getByText('Your review')).toBeInTheDocument()
  })

  it('renders fallback when comment is null or empty', () => {
    render(
      <ReviewCard
        review={{
          id: 3,
          reviewerName: 'Alice',
          comment: '',
          score: 3,
        }}
      />
    )

    expect(screen.getByText('No written comment provided.')).toBeInTheDocument()
  })
})
