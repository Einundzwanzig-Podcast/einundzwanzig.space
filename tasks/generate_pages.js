const pug = require('pug')
const { mkdirSync, writeFileSync } = require('fs')
const { dirname, resolve } = require('path')
const { slugify } = require('../helpers')
const config = require('../pug.config')
const site = require('../generated/site-data.json')
const episodes = require('../generated/episodes.json')
const spendenregister = require('../generated/spendenregister.json')
const spendenuebersicht = require('../content/spendenuebersicht.json').reverse()
const team = require('../content/team.json')
const shops = require('../content/shops.json')
const soundboard = require('../content/soundboard.json')
const adventskalender = require('../content/adventskalender-2022.json')

const categories = {
  'news': 'News',
  'interview': 'Interviews',
  'lesestunde': 'Lesestunde',
  'der-weg': 'Der Weg',
  'on-tour': 'On Tour',
  'verschiedenes': 'Verschiedenes'
}

const changedFile = process.argv.length > 2 && process.argv[2]

const renderPage = (template, out, data = {}) => {
  const templateFile = `src/${template}.pug`
  const needsRender = !changedFile || changedFile === templateFile || changedFile.startsWith('src/includes') || changedFile.endsWith('.js') || changedFile.endsWith('.json')
  if (!needsRender) return

  const file = resolve(__dirname, '..', templateFile)
  const options = Object.assign({}, config, { site }, data)
  const rendered = pug.renderFile(file, options)
  const dest = out === 'index' ? 'index.html' : `${out}/index.html`
  const dst = resolve(__dirname, '..', 'dist', dest)
  const dir = dirname(dst)

  mkdirSync(dir, { recursive: true })
  writeFileSync(dst, rendered)
}

renderPage('index', 'index', { navCurrent: 'index', currentEpisode: episodes[0], team })
renderPage('podcast', 'podcast', { navCurrent: 'podcast', episodes: [...episodes], team })
renderPage('gesundes-geld', 'gesundes-geld', { meetups: site.meetups })
renderPage('meetups', 'meetups', { navCurrent: 'meetups', meetups: site.meetups })
renderPage('spenden', 'spenden', { navCurrent: 'spenden', spendenregister, spendenuebersicht })
renderPage('media', 'media', { navCurrent: 'media' })
renderPage('soundboard', 'soundboard', { navCurrent: 'soundboard', soundboard })
renderPage('telegram', 'telegram', { navCurrent: 'telegram', telegram: site.telegram })
renderPage('shops', 'shops', { navCurrent: 'shops', shops })
renderPage('verein', 'verein', { navCurrent: 'verein' })
renderPage('kontakt', 'kontakt', { navCurrent: 'kontakt' })
renderPage('datenschutz', 'datenschutz', { navCurrent: 'datenschutz' })
renderPage('adventskalender', 'adventskalender', { adventskalender })

episodes.forEach(episode => renderPage('episode', `podcast/${episode.slug}`, { navCurrent: 'podcast', episode, team }))
Object.keys(categories).forEach(category => renderPage('category', `podcast/${slugify(categories[category])}`, { navCurrent: 'podcast', category, categoryName: categories[category], episodes: episodes.filter(e => e.category === category), team }))
Object.keys(team).forEach(id => {
  const member = team[id]
  const alias = member.name.toLowerCase()
  const eps = episodes.filter(e => e.participants.find(p => [id, alias].includes(p.toLowerCase())))
  renderPage('member', `team/${slugify(id)}`, { navCurrent: 'podcast', member, episodes: eps, team })
})
