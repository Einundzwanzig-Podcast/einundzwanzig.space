document.addEventListener("DOMContentLoaded", () => {
  const $body = document.body
  const $headerAnchor = document.getElementById('header-anchor')

  // Topbar
  const topbarClass = 'topbar'
  const topbarAppearClass = 'topbar--appear'
  const addTopbar = () => {
    $body.classList.add(topbarClass)
    window.setTimeout(() => {
      $body.classList.add(topbarAppearClass)
    }, 25)
  }
  const removeTopbar = () => {
    $body.classList.remove(topbarClass)
    $body.classList.remove(topbarAppearClass)
  }

  if (
    "IntersectionObserver" in window &&
    "IntersectionObserverEntry" in window &&
    "intersectionRatio" in window.IntersectionObserverEntry.prototype
  ) {
    const headerObserver = new IntersectionObserver(entries => {
      const { boundingClientRect: { y, height } } = entries[0]
      if (Math.abs(y) > height) {
        addTopbar()
      } else {
        removeTopbar()
      }
    })

    headerObserver.observe($headerAnchor)
  }
})
