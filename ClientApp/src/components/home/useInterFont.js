import { useEffect } from 'react'

const FONT_ID = 'futurewings-inter-font'
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'

/**
 * src/index.css declares `font-family: Inter, ...` but nothing ever loads Inter —
 * index.html carries only a favicon <link>, there is no @font-face or @import, and
 * no font package is installed. The app has therefore been silently rendering in
 * ui-sans-serif/system-ui this whole time.
 *
 * index.html now carries the real <link> (same id as FONT_ID below), so in this
 * app the guard below short-circuits and this hook does nothing — that is the
 * intended path, since a <head> link avoids the reflow you get when the first
 * paint lands in the fallback face.
 *
 * It is kept so <Home /> stays self-contained and still renders in Inter if it is
 * ever mounted somewhere without that link.
 */
export function useInterFont() {
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return undefined

    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = 'https://fonts.gstatic.com'
    preconnect.crossOrigin = 'anonymous'
    preconnect.dataset.futurewingsFont = 'true'

    const stylesheet = document.createElement('link')
    stylesheet.id = FONT_ID
    stylesheet.rel = 'stylesheet'
    stylesheet.href = FONT_HREF
    stylesheet.dataset.futurewingsFont = 'true'

    document.head.append(preconnect, stylesheet)

    return () => {
      // Leave the font in place on unmount: removing it would cause a visible
      // reflow if the user navigates back, and the cost is a single cached request.
    }
  }, [])
}
