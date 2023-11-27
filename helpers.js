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

// replacements
const replacements = str => {
  return str && str.replace(/<\/?u>/g, '').replace(meta.tallycoinUrl, meta.shoutoutUrl)
}

const stripHTML = str => {
  return str && encode(decode(str.replace(/(<([^>]+)>)/ig, '').trim().replace(/\n\s*/g, '\n')), { level: 'xml' })
}

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

// team
const teamWithAliases = team => {
  const withAliases = {}
  Object.entries(team).forEach(([id, member]) => {
    withAliases[id] = member
    const aliases = (member.aliases || []).concat(member.name.toLowerCase())
    aliases.forEach(alias => {
      const aliasId = alias.toLowerCase()
      if (!withAliases[aliasId]) withAliases[aliasId] = member
    })
  })
  return withAliases
}

module.exports = {
  markdown: mdTransformer.render,
  replacements,
  slugify,
  stripHTML,
  truncate,
  teamWithAliases,
  toMeetupMapInfo
}
