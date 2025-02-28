const { decode, encode } = require('html-entities')
const meta = require('./content/meta.json')

// configure markdown-it
const transformer = require('jstransformer')
const { _tr: mdTransformer } = transformer(require('jstransformer-markdown-it'))

const config = {
  typographer: true,
  html: true
}

// monkey-patch render function to pass custom options
const { render: renderMd } = mdTransformer

mdTransformer.render = str => renderMd(str, config)

// constants
const IS_DEV = process.env.NODE_ENV === 'development'
const HOST = IS_DEV ? 'http://localhost:3000' : 'https://einundzwanzig.space'

// replacements
const replacements = str => str && str.replace(/<\/?u>/g, '').replace(meta.tallycoinUrl, meta.shoutoutUrl)
const stripHTML = str => str && encode(decode(str.replace(/(<([^>]+)>)/ig, '').trim().replace(/\n\s*/g, '\n')), { level: 'xml' })

// meetups
const toMeetupMapInfo = m => {
  return {
    name: m.name,
    latLng: [m.latitude, m.longitude],
    url: m.url,
    city: m.city,
    portalUrl: m.portalLink,
    websiteUrl: m.websiteUrl,
    twitter: m.twitter_username,
    event: m.next_event,
    style: {
      fill: m.name.startsWith('Einundzwanzig') || m.name.includes('Einezwänzg') || m.name.includes('Eenanzwanzeg') || m.name.includes('Yirmibir') ? 'var(--color-accent)' : 'var(--color-neutral-50)'
    }
  }
}

// slug
const slugify = str => str.toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
  .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')

const truncate = (str, wordCount) => {
  const words = str.trim().split(/\s(?![^\[]*\])/g)
  const head = words.splice(0, wordCount).join(' ')
  const tail = words.join(' ')
  return [head, tail]
}

// participants
const participantsWithAliases = participants => {
  const withAliases = {}
  Object.entries(participants).forEach(([id, member]) => {
    withAliases[id] = member
    const aliases = (member.aliases || []).concat(member.name.toLowerCase())
    aliases.forEach(alias => {
      const aliasId = alias.toLowerCase()
      if (!withAliases[aliasId]) withAliases[aliasId] = member
    })
  })
  return withAliases
}

const participantToId = p => p.replace(/\(.*?\)/, '').trim().toLowerCase()
const random = max =>  Math.floor(Math.random() * Math.floor(max))
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); const temp = arr[i]; arr[i] = arr[j]; arr[j] = temp; }; return arr }
const formatDate = date => (new Date(date)).toISOString().replace(/T.*/, '').split('-').reverse().join('.')
const linkTarget = url => url.startsWith('http') ? '_blank' : null
const assetPath = path => {
  if (path.startsWith('http')) return path
  let revs
  try { revs = require('./generated/rev.json') } catch (error) { }
  return `${(revs && revs[path]) || path}`
}
const assetUrl = (path, protocol = 'https') => {
  if (IS_DEV && !path.startsWith('http')) protocol = 'http'
  const base = path.startsWith('http') ? '' : HOST
  let url = `${base}${assetPath(path)}`
  if (!url.startsWith(`${protocol}:`)) url = url.replace(/^.*:/, `${protocol}:`)
  return url
}

module.exports = {
  markdown: mdTransformer.render,
  random,
  shuffle,
  assetUrl,
  assetPath,
  formatDate,
  linkTarget,
  replacements,
  slugify,
  stripHTML,
  truncate,
  participantsWithAliases,
  participantToId,
  toMeetupMapInfo
}
