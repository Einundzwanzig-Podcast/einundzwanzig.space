const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); const temp = arr[i]; arr[i] = arr[j]; arr[j] = temp; }; return arr }

// Theme Switch
const COLOR_MODES = ["light", "dark"]
const THEME_ATTR = "data-theme"
const STORE_ATTR = "theme"
const systemColorMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? COLOR_MODES[1] : COLOR_MODES[0]
const userColorMode = window.localStorage.getItem(STORE_ATTR)
const initialColorMode = COLOR_MODES.includes(userColorMode) ? userColorMode : systemColorMode

const setColorMode = mode => {
  if (COLOR_MODES.includes(mode)) {
    window.localStorage.setItem(STORE_ATTR, mode)
    document.documentElement.setAttribute(THEME_ATTR, mode)
  }
}

setColorMode(initialColorMode)

const copyToClipboard = (e, text) => {
  if (navigator.clipboard) {
    e.preventDefault()
    const item = e.currentTarget
    const data = text || item.getAttribute('data-clipboard')
    const confirm = item.querySelector('[data-clipboard-confirm]') || item
    const message = confirm.getAttribute('data-clipboard-confirm') || 'Kopiert ✔'
    if (!confirm.dataset.clipboardInitialText) {
      confirm.dataset.clipboardInitialText = confirm.innerText
      confirm.style.minWidth = confirm.getBoundingClientRect().width + 'px'
    }
    navigator.clipboard.writeText(data).then(() => {
      confirm.innerText = message;
      setTimeout(() => { confirm.innerText = confirm.dataset.clipboardInitialText; }, 2500)
    })
    item.blur()
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Topbar
  if (
    "IntersectionObserver" in window &&
    "IntersectionObserverEntry" in window &&
    "intersectionRatio" in window.IntersectionObserverEntry.prototype
  ) {
    const headerObserver = new IntersectionObserver(entries => {
      const { boundingClientRect: { y, height } } = entries[0]
      const fn = Math.abs(y) > height ? 'add' : 'remove'
      document.body.classList[fn]('topbar')
    })
    headerObserver.observe(document.getElementById('header-anchor'))
  }

  // List shuffling
  const lists = document.querySelectorAll('[data-shuffle]')
  lists.forEach(list => {
    const items = Array.from(list.children)
    list.innerHTML = ""
    shuffle(items).forEach(item => list.appendChild(item))
  })

  // Player
  if (window.Amplitude && window.player) {
    window.Amplitude.init(window.player)

    document.querySelector('.player__progress').addEventListener('click', function (e) {
      const offset = this.getBoundingClientRect()
      const x = e.pageX - offset.left
      window.Amplitude.setSongPlayedPercentage((parseFloat(x) / parseFloat(this.offsetWidth)) * 100)
    })
  }

  // Theme Switch
  document.querySelectorAll('.theme').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault()
      const current = document.documentElement.getAttribute(THEME_ATTR) || COLOR_MODES[0]
      const mode = current === COLOR_MODES[0] ? COLOR_MODES[1] : COLOR_MODES[0]
      setColorMode(mode)
    })
  })

  // Copy to clipboard
  document.querySelectorAll('[data-clipboard]').forEach(link => {
    link.addEventListener('click', copyToClipboard)
  })

  // Show more
  document.querySelectorAll('.showMore').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault()
      link.parentNode.parentNode.classList.add('expanded')
    })
  })
})
