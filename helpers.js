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

const memberUrl = member => {
  if (member.url) return member.url
  else if (member.nostr) return `https://snort.social/p/${member.nostr}`
  else if (member.twitter) return `https://twitter.com/${member.twitter}`
}

module.exports = {
  markdown: mdTransformer.render,
  replacements,
  slugify,
  stripHTML,
  truncate,
  memberUrl
}
