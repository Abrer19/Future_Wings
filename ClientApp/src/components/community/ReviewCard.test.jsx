import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ReviewCard from './ReviewCard.jsx'

describe('ReviewCard XSS safety and sanitized rendering', () => {
  it('sanitizes <script> tags so they never create a script element and do not display raw script markup', () => {
    const maliciousComment = '<script>alert("XSS")</script><b>Sanitized Text</b>'
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

    // Verify raw <script> tag markup is NOT rendered on the screen
    expect(screen.queryByText(/<script/i)).toBeNull()

    // Verify clean sanitized text is rendered as an escaped React text node
    const commentEl = screen.getByTestId('review-comment')
    expect(commentEl).toBeInTheDocument()
    expect(commentEl.textContent).toBe('Sanitized Text')
    expect(screen.getByText('Sanitized Text')).toBeInTheDocument()
  })

  it('sanitizes <img onerror> tags so no image DOM element is created and raw tags are not displayed', () => {
    const maliciousPayload = '<img src=x onerror=alert("xss") />Great campus atmosphere!'
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

    // Verify raw <img> markup is not displayed
    expect(screen.queryByText(/<img/i)).toBeNull()

    // Verify readable text is rendered
    const commentEl = screen.getByTestId('review-comment')
    expect(commentEl.textContent).toBe('Great campus atmosphere!')
    expect(screen.getByText('Your review')).toBeInTheDocument()
  })

  it('displays <b>Helpful review</b> as readable plain text without raw markup', () => {
    const boldReview = '<b>Helpful review</b>'
    const { container } = render(
      <ReviewCard
        review={{
          id: 3,
          reviewerName: 'Student Reviewer',
          comment: boldReview,
          score: 5,
          isMine: false,
        }}
      />
    )

    // Verify no <b> DOM element exists
    expect(container.querySelector('b')).toBeNull()

    // Verify raw <b> tag is not displayed
    expect(screen.queryByText('<b>Helpful review</b>')).toBeNull()

    // Verify readable plain text displays
    const commentEl = screen.getByTestId('review-comment')
    expect(commentEl.textContent).toBe('Helpful review')
    expect(screen.getByText('Helpful review')).toBeInTheDocument()
  })

  it('renders normal reviews correctly without alteration', () => {
    const normalText = 'World-class engineering education and practically zero tuition.'
    render(
      <ReviewCard
        review={{
          id: 4,
          reviewerName: 'Alex Chen',
          comment: normalText,
          score: 5,
          isMine: false,
        }}
      />
    )

    const commentEl = screen.getByTestId('review-comment')
    expect(commentEl.textContent).toBe(normalText)
  })

  it('preserves line breaks and readable spacing without executing HTML', () => {
    const multilineComment = 'Great academics.<br/>Very supportive faculty.\n\nLoved the campus library.'
    render(
      <ReviewCard
        review={{
          id: 5,
          reviewerName: 'Marcus',
          comment: multilineComment,
          score: 5,
          isMine: false,
        }}
      />
    )

    const commentEl = screen.getByTestId('review-comment')
    expect(commentEl.textContent).toContain('Great academics.\nVery supportive faculty.\n\nLoved the campus library.')
    expect(commentEl.className).toContain('whitespace-pre-line')
  })

  it('renders fallback when comment is null, empty, or only contains stripped tags', () => {
    const { rerender } = render(
      <ReviewCard
        review={{
          id: 6,
          reviewerName: 'Alice',
          comment: '',
          score: 3,
        }}
      />
    )
    expect(screen.getByText('No written comment provided.')).toBeInTheDocument()

    // When comment only has executable markup that gets stripped
    rerender(
      <ReviewCard
        review={{
          id: 6,
          reviewerName: 'Alice',
          comment: '<script>alert(1)</script>',
          score: 3,
        }}
      />
    )
    expect(screen.getByText('No written comment provided.')).toBeInTheDocument()
  })

  it('ensures review submission and API-loaded reviews use the same safe rendering path', () => {
    // API-loaded review with HTML tags
    const apiLoadedReview = {
      id: 101,
      universityId: 1,
      reviewerName: 'Aria Chen',
      comment: '<b>Exceptional co-op</b> and industry connections.<script>alert(1)</script>',
      score: 5,
      isMine: false,
    }

    // Newly submitted review created from form submission
    const submittedReview = {
      id: 102,
      universityId: 1,
      reviewerName: 'Current User',
      comment: '<b>Exceptional co-op</b> and industry connections.<script>alert(1)</script>',
      score: 5,
      isMine: true,
    }

    const { rerender, container } = render(<ReviewCard review={apiLoadedReview} />)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    expect(screen.getByTestId('review-comment').textContent).toBe('Exceptional co-op and industry connections.')

    rerender(<ReviewCard review={submittedReview} />)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
    expect(screen.getByTestId('review-comment').textContent).toBe('Exceptional co-op and industry connections.')
    expect(screen.getByText('Your review')).toBeInTheDocument()
  })
})
