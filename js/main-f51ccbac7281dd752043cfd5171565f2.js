const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); const temp = arr[i]; arr[i] = arr[j]; arr[j] = temp; }; return arr }
const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Berlin' })
const formatDate = date => dateFormat.format(date) + ' Uhr'

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

if (!document.documentElement.hasAttribute(THEME_ATTR)) {
  setColorMode(initialColorMode)
}

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

const toggleModal = modalId => {
  const $modal = document.getElementById(modalId)
  const isVisible = $modal.classList.contains('modal--visible')
  if (isVisible) {
    $modal.addEventListener('transitionend', () => { $modal.classList.toggle('modal--visible') }, { once: true })
    $modal.classList.toggle('modal--appear')
  } else {
    $modal.classList.toggle('modal--visible')
    window.setTimeout(() => { $modal.classList.toggle('modal--appear') }, 25)
  }
}

const onMeetupMapMarkerClick = (m, modalId) => {
  console.log(modalId, m)
  const city = m.city ? m.city.trim() : ''
  const date = m.event ? new Date(`${m.event.start}Z`) : null
  const webUrl = m.url != m.websiteUrl ? m.websiteUrl : null
  const twitterUrl = m.twitter ? `https://twitter.com/${m.twitter}` : null
  const title = m.name + (city && !m.name.includes(city) ? ` (${city})` : '')
  const urlTitle = m.url.includes('t.me/')
    ? 'Telegram'
    : m.url.includes('meetup.com/') ? 'Meetup.com' : 'Website'
  const link = (url, title) => url ? `<a href="${url}" target="_blank" rel="nofollow noopener">${title}</a>` : ''
  document.getElementById('meeptupDetails').innerHTML = `
    <h2>${title}</h2>
    <p class="links">
      Meetup-Links:
      ${link(m.portalUrl, 'Portal')}
      ${link(m.url, urlTitle)}
      ${link(webUrl, 'Website')}
      ${link(twitterUrl, 'Twitter')}
    </p>` + (m.event ? `
    <h3>Nächstes Treffen</h3>
    <p class="date">${formatDate(date)}${m.event.location ? ` @ ${m.event.location}` : ''}</p>
    ${m.event.description ? `<p>${m.event.description.replace('\n', '<br />')}</p>` : ''}
    <p class="links">
      Links zum Treffen:
      ${link(m.event.portalLink, 'Portal')}
      ${link(m.event.link, 'Website')}
      ${link(m.event.nostr_note ? `https://snort.social/e/${m.event.nostr_note}` : null, 'Nostr')}
    </p>` : '')

  toggleModal(modalId)
}

document.addEventListener("DOMContentLoaded", () => {
  // Topbar
  if (
    "IntersectionObserver" in window &&
    "IntersectionObserverEntry" in window &&
    "intersectionRatio" in window.IntersectionObserverEntry.prototype
  ) {
    const headerAnchor = document.getElementById('header-anchor')
    if (headerAnchor) {
      const headerObserver = new IntersectionObserver(entries => {
        const { boundingClientRect: { y, height } } = entries[0]
        const fn = Math.abs(y) > height ? 'add' : 'remove'
        document.body.classList[fn]('topbar')
      })
      headerObserver.observe(headerAnchor)
    }
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

  // Video
  document.querySelectorAll('.ytEmbed').forEach(video => {
    video.addEventListener('click', e => {
      e.preventDefault()
      const lazyAttr = 'data-src'
      const iframe = e.target.querySelector(`iframe[${lazyAttr}]`)
      if (iframe) {
        const src = iframe.setAttribute('src', iframe.getAttribute(lazyAttr))
      }
    })
  })

  // Modal
  document.querySelectorAll('[data-modal]').forEach(modalLink => {
    modalLink.addEventListener('click', e => toggleModal(modalLink.dataset.modal))
  })

  // Map
  const map = document.getElementById('map')
  const mapImg = document.getElementById('dach')
  const tooltip = document.getElementById('tooltip')
  if (map && mapImg && tooltip) {
    mapImg.onclick = e => {
      const top = Math.round((e.offsetY / e.target.height) * 100) - 2
      const left = Math.round((e.offsetX / e.target.width) * 100) + 1
      console.log({ top, left }, map)
      tooltip.innerText = `Top: ${top} / Left: ${left}`
      tooltip.removeAttribute('hidden')
      tooltip.style.top = `${top + 1}%`
      tooltip.style.left = `${left}%`
    }
  }
})
