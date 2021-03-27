const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const { replacements } = require('../helpers')
const { masterFeedUrl, publicFeedUrl } = require('../content/meta.json')
const request = require('sync-request')
const Parser = require('rss-parser')

const dir = resolve(__dirname, '..')
const write = (name, data) => writeFileSync(join(dir, name), data)
const writeJSON = (name, data) => write(`generated/${name}.json`, JSON.stringify(data, null, 2))

const slugify = str => str.toLowerCase()
  .replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
  .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')

const parseBaseInfoFromMatch = m => {
  let [, categoryName = 'News', number, titlePlain] = m ? m : [,,,]
  if (!number) categoryName = 'Verschiedenes'
  if (categoryName === 'Der-Weg') categoryName = 'Der Weg'
  return { categoryName, number, titlePlain }
}

const parseInfo = e => {
  const titleMatch = e.title.match(/([\w\s]+?)?\s?#(\d+) - (.*)/)
  const { categoryName, number, titlePlain } = parseBaseInfoFromMatch(titleMatch)
  const blockMatch = e.contentSnippet.match(/Blockzeit\s(\d+)/)
  const block = blockMatch ? parseInt(blockMatch[1]) : null
  const category = slugify(categoryName)
  const slug = slugify(`${categoryName} ${number || ''} ${titlePlain}`)
  return { block, category, categoryName, number, titlePlain, slug }
}

;(async () => {
  // Load and adapt feed
  const xml = request('GET', masterFeedUrl).getBody('utf8')
    .replace(/<itunes:email>(.*?)<\/itunes:email>/g, '<itunes:email>einundzwanzigpodcast@pm.me</itunes:email>')
    .replace(`"${masterFeedUrl}"`, `"${publicFeedUrl}"`)

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

  // Original Anchor-Feed
  const updated = xml
    .replace(/<link>(https:\/\/anchor\.fm\/einundzwanzig\/episodes\/(.*?))<\/link>/gi, (match, url, anchorSlug) => {
      const slugMatch = anchorSlug.match(/^(?:(.*)-)?([0-9]+?)---/)
      const { categoryName, number } = parseBaseInfoFromMatch(slugMatch)
      const episode = slugMatch ? episodes.find(e => e.categoryName == categoryName && e.number === number) : null
      const link = episode ? `https://einundzwanzig.space/podcast/${episode.slug}` : url
      return `<link>${link}</link>`
    })
  write('dist/feed.xml', updated)
})()
