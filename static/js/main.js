const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); const temp = arr[i]; arr[i] = arr[j]; arr[j] = temp; }; return arr }

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

  // List shuffling
  const lists = document.querySelectorAll('[data-shuffle]')
  lists.forEach(list => {
    const items = Array.from(list.children)
    list.innerHTML = ""
    shuffle(items).forEach(item => list.appendChild(item))
  })
})
