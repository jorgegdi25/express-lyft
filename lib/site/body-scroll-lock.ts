let locks = 0
let previousOverflow = ''

// The mobile menu and booking dialog may overlap during the same click.
export function lockBodyScroll() {
  if (locks === 0) previousOverflow = document.body.style.overflow
  locks += 1
  document.body.style.overflow = 'hidden'
  let released = false
  return () => {
    if (released) return
    released = true
    locks -= 1
    if (locks === 0) document.body.style.overflow = previousOverflow
  }
}

export function visibleFocusTargets(...roots: (HTMLElement | null)[]) {
  return roots.flatMap((root) => root ? Array.from(root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
  )).filter((el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden') : [])
}
