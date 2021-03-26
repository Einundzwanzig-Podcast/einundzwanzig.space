const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const { replacements } = require('../helpers')
const request = require('sync-request')
const Parser = require('rss-parser')

const dir = resolve(__dirname, '..')
const write = (name, data) => writeFileSync(join(dir, name), data)
const writeJSON = (name, data) => write(`generated/${name}.json`, JSON.stringify(data, null, 2))

const slugify = str => str.toLowerCase()
  .replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
  .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')

const parseInfo = e => {
  const titleMatch = e.title.match(/([\w\s]+?)?\s?#(\d+) - (.*)/)
  let [, categoryName = 'News', number, titlePlain] = titleMatch ? titleMatch : [,,,e.title]
  if (!number) categoryName = 'Verschiedenes'
  const blockMatch = e.contentSnippet.match(/Blockzeit\s(\d+)/)
  const block = blockMatch ? parseInt(blockMatch[1]) : null
  const category = slugify(categoryName)
  const slug = slugify(`${categoryName} ${number || ''} ${titlePlain}`)
  return { block, category, categoryName, number, titlePlain, slug }
}

;(async () => {
  // Load and adapt feed
  let xml = request('GET', 'https://anchor.fm/s/d8d3c38/podcast/rss').getBody('utf8')
  xml = xml.replace(/<itunes:email>(.*?)<\/itunes:email>/, '<itunes:email>einundzwanzigpodcast@pm.me</itunes:email>')
  // Parse feed
  const parser = new Parser()
  const feed = await parser.parseString(xml)

  // Original Anchor-Feed
  write('dist/feed.xml', xml)
  writeJSON('feed', feed)

  // All episodes
  const episodes = feed.items.map(e => {
    const info = parseInfo(e)
    const image = ['interview', 'verschiedenes'].includes(info.category) ? e.itunes.image : `/img/cover/${info.category}.png`
    return {
      title: e.title.trim(),
      content: replacements(e.content.trim()),
      contentSnippet: replacements(e.contentSnippet.trim()),
      anchor: e.link,
      date: e.isoDate,
      enclosure: e.enclosure,
      duration: e.itunes.duration,
      season: e.itunes.season,
      episode: e.itunes.episode,
      guid: e.guid,
      image,
      originalImage: e.itunes.image,
      ...info
    }
  })

  writeJSON('episodes', episodes)
})()
