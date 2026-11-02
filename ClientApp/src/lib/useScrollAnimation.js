import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Checks whether user has requested reduced motion.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Hook to reveal an element or its children on scroll using GSAP ScrollTrigger.
 */
export function useScrollReveal({
  direction = 'up',
  distance = 36,
  duration = 0.8,
  stagger = 0.12,
  delay = 0,
  threshold = 'top 85%',
} = {}) {
  const elementRef = useRef(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return undefined

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, x: 0, y: 0, clearProps: 'all' })
      return undefined
    }

    const ctx = gsap.context(() => {
      let xOffset = 0
      let yOffset = 0
      if (direction === 'up') yOffset = distance
      else if (direction === 'down') yOffset = -distance
      else if (direction === 'left') xOffset = distance
      else if (direction === 'right') xOffset = -distance

      const targets = el.dataset.staggerChildren ? el.children : el

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          x: xOffset,
          y: yOffset,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration,
          delay,
          stagger: el.dataset.staggerChildren ? stagger : 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: threshold,
            toggleActions: 'play none none none',
            once: true,
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [direction, distance, duration, stagger, delay, threshold])

  return elementRef
}

/**
 * Hook to add subtle floating ambient motion to hero cards.
 */
export function useParallaxFloat({ yDistance = 8, duration = 3.5, delay = 0 } = {}) {
  const elementRef = useRef(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el || prefersReducedMotion()) return undefined

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: -yDistance,
        duration,
        delay,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, el)

    return () => ctx.revert()
  }, [yDistance, duration, delay])

  return elementRef
}

/**
 * Hook to animate numerical statistics counters on scroll into view.
 */
export function useCountUp(targetNumber, { suffix = '', duration = 1.8 } = {}) {
  const elementRef = useRef(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return undefined

    if (prefersReducedMotion()) {
      el.textContent = `${targetNumber.toLocaleString()}${suffix}`
      return undefined
    }

    const ctx = gsap.context(() => {
      const obj = { val: 0 }
      gsap.to(obj, {
        val: targetNumber,
        duration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,
        },
        onUpdate: () => {
          if (el) {
            el.textContent = `${Math.floor(obj.val).toLocaleString()}${suffix}`
          }
        },
      })
    }, el)

    return () => ctx.revert()
  }, [targetNumber, suffix, duration])

  return elementRef
}
