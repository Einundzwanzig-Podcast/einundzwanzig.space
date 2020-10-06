const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const Parser = require('rss-parser')

const dir = resolve(__dirname, '..', 'generated')
const write = (name, data) => writeFileSync(join(dir, `${name}.json`), JSON.stringify(data, null, 2))

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
  const parser = new Parser()
  const feed = await parser.parseURL('https://anchor.fm/s/d8d3c38/podcast/rss')

  // Original Anchor-Feed
  write('feed', feed)

  // All episodes
  const episodes = feed.items.map(e => {
    const info = parseInfo(e)
    const image = info.category === 'interview' ? e.itunes.image : `/img/cover/${info.category}.png`
    return {
      title: e.title.trim(),
      content: e.content.trim(),
      contentSnippet: e.contentSnippet.trim(),
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

  write('episodes', episodes)
})()
