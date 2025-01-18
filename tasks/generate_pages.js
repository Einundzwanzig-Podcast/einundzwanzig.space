const pug = require('pug')
const { mkdirSync, writeFileSync } = require('fs')
const { dirname, resolve } = require('path')
const { slugify, participantsWithAliases, participantToId } = require('../helpers')
const config = require('../pug.config')
const site = require('../generated/site-data.json')
const episodes = require('../generated/episodes.json')
const spendenregister = require('../generated/spendenregister.json')
const spendenuebersicht = require('../content/spendenuebersicht.json').reverse()
const participantsRaw = require('../content/participants.json')
const shops = require('../content/shops.json')
const soundboard = require('../content/soundboard.json')
const adventskalender = require('../content/adventskalender-2022.json')

const categories = {
  'news': 'News',
  'interview': 'Interviews',
  'lesestunde': 'Lesestunde',
  'der-weg': 'Der Weg',
  'on-tour': 'On Tour',
  'nostrtalk': 'NostrTalk',
  'filterfrei': 'FilterFrei',
  'verschiedenes': 'Verschiedenes'
}

const participants = participantsWithAliases(participantsRaw)

const changedFile = process.argv.length > 2 && process.argv[2]

const renderPage = (template, out, data = {}) => {
  const templateFile = `src/${template}.pug`
  const needsRender = !changedFile || changedFile === templateFile || changedFile.startsWith('src/includes') || changedFile.endsWith('.js') || changedFile.endsWith('.json')
  if (!needsRender) return

  const dest = out === 'index' ? 'index.html' : `${out}/index.html`
  const pagePath = out === 'index' ? '/' : `/${out}/`
  const file = resolve(__dirname, '..', templateFile)
  const options = Object.assign({}, config, { site }, data, { pagePath })
  const rendered = pug.renderFile(file, options)
  const dst = resolve(__dirname, '..', 'dist', dest)
  const dir = dirname(dst)

  mkdirSync(dir, { recursive: true })
  writeFileSync(dst, rendered)
}

renderPage('index', 'index', { navCurrent: 'index', currentEpisode: episodes[0], participants })
renderPage('podcast', 'podcast', { navCurrent: 'podcast', episodes: [...episodes], participants })
renderPage('gesundes-geld', 'gesundes-geld', { meetups: site.meetups, upcomingMeetups: site.upcomingMeetups })
renderPage('meetups', 'meetups', { navCurrent: 'meetups', meetups: site.meetups, upcomingMeetups: site.upcomingMeetups })
renderPage('spenden', 'spenden', { navCurrent: 'spenden', spendenregister, spendenuebersicht })
renderPage('media', 'media', { navCurrent: 'media' })
renderPage('soundboard', 'soundboard', { navCurrent: 'soundboard', soundboard })
renderPage('shops', 'shops', { navCurrent: 'shops', shops })
renderPage('verein', 'verein', { navCurrent: 'verein' })
renderPage('kontakt', 'kontakt', { navCurrent: 'kontakt' })
renderPage('datenschutz', 'datenschutz', { navCurrent: 'datenschutz' })
renderPage('adventskalender', 'adventskalender', { adventskalender })

episodes.forEach(episode => renderPage('episode', `podcast/${episode.slug}`, { navCurrent: 'podcast', episode, participants }))
Object.keys(categories).forEach(category => renderPage('category', `podcast/${slugify(categories[category])}`, { navCurrent: 'podcast', category, categoryName: categories[category], episodes: episodes.filter(e => e.category === category), participants }))
Object.keys(participantsRaw).forEach(id => {
  const member = participantsRaw[id]
  const aliases = (member.aliases || []).map(m => m.toLowerCase()).concat(member.name.toLowerCase())
  const eps = episodes.filter(e => e.participants.find(p => [id, ...aliases].includes(participantToId(p))))
  renderPage('member', `p/${slugify(id)}`, { navCurrent: 'podcast', member, episodes: eps, participants })
})
