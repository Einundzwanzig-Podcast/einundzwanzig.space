const pug = require('pug')
const { mkdirSync, writeFileSync } = require('fs')
const { dirname, resolve } = require('path')

const config = require('../pug.config')
const site = require('../generated/site-data.json')
const episodes = require('../generated/episodes.json')
const spendenregister = require('../generated/spendenregister.json')
const spendenuebersicht = require('../content/spendenuebersicht.json').reverse()
const team = require('../content/team.json')
const kurse = require('../content/kurse.json')
const shops = require('../content/shops.json')
const soundboard = require('../content/soundboard.json')
const adventskalender = require('../content/adventskalender-2022.json')

const renderPage = (template, out, data = {}) => {
  const file = resolve(__dirname, '..', `src/${template}.pug`)
  const options = Object.assign({}, config, { site }, data)
  const rendered = pug.renderFile(file, options)
  const dest = out === 'index' ? 'index.html' : `${out}/index.html`
  const dst = resolve(__dirname, '..', 'dist', dest)
  const dir = dirname(dst)

  mkdirSync(dir, { recursive: true })
  writeFileSync(dst, rendered)
}

const sortId = m => `${m.country === 'DE' ? '0' : m.country}-${m.name}`
const meetupsSorted = site.meetups.sort((a, b) => {
  return sortId(a) > sortId(b) ? 1 : -1
})

renderPage('index', 'index', { navCurrent: 'index', currentEpisode: episodes[0], team })
renderPage('podcast', 'podcast', { navCurrent: 'podcast', episodes: [...episodes], team })
renderPage('meetups', 'meetups', { navCurrent: 'meetups', meetups: meetupsSorted })
renderPage('kurse', 'kurse', { navCurrent: 'kurse', kurse })
renderPage('spenden', 'spenden', { navCurrent: 'spenden', spendenregister, spendenuebersicht })
renderPage('media', 'media', { navCurrent: 'media' })
renderPage('soundboard', 'soundboard', { navCurrent: 'soundboard', soundboard })
renderPage('telegram', 'telegram', { navCurrent: 'telegram', telegram: site.telegram })
renderPage('events', 'events', { navCurrent: 'events' })
renderPage('events/satoshis-bleibe-2022', 'events/satoshis-bleibe-2022', { navCurrent: 'events'})
renderPage('events/bitcoin-im-laendle-2022', 'events/bitcoin-im-laendle-2022', { navCurrent: 'events' })
renderPage('events/sommerfest-hodler-heide-2022', 'events/sommerfest-hodler-heide-2022', { navCurrent: 'events'})
renderPage('events/satoshis-beach-2022', 'events/satoshis-beach-2022', { navCurrent: 'events'})
renderPage('shops', 'shops', { navCurrent: 'shops', shops })
renderPage('verein', 'verein', { navCurrent: 'verein' })
renderPage('kontakt', 'kontakt', { navCurrent: 'kontakt' })
renderPage('datenschutz', 'datenschutz', { navCurrent: 'datenschutz' })
renderPage('adventskalender', 'adventskalender', { adventskalender })
renderPage('gesundes-geld', 'gesundes-geld', { meetups: meetupsSorted })
renderPage('category', 'podcast/news', { navCurrent: 'podcast', category: 'news', categoryName: 'News', episodes: episodes.filter(e => e.category === 'news'), team })
renderPage('category', 'podcast/interviews', { navCurrent: 'podcast', category: 'interview', categoryName: 'Interviews', episodes: episodes.filter(e => e.category === 'interview'), team })
renderPage('category', 'podcast/lesestunde', { navCurrent: 'podcast', category: 'lesestunde', categoryName: 'Lesestunde', episodes: episodes.filter(e => e.category === 'lesestunde'), team })
renderPage('category', 'podcast/der-weg', { navCurrent: 'podcast', category: 'der-weg', categoryName: 'Der Weg', episodes: episodes.filter(e => e.category === 'der-weg'), team })
renderPage('category', 'podcast/on-tour', { navCurrent: 'podcast', category: 'on-tour', categoryName: 'On Tour', episodes: episodes.filter(e => e.category === 'on-tour'), team })
renderPage('category', 'podcast/verschiedenes', { navCurrent: 'podcast', category: 'verschiedenes', categoryName: 'Verschiedenes', episodes: episodes.filter(e => e.category === 'verschiedenes'), team })
episodes.forEach(episode => renderPage('episode', `podcast/${episode.slug}`, { navCurrent: 'podcast', episode, team }))
