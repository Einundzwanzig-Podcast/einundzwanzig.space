const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const Parser = require('rss-parser')

const dir = resolve(__dirname, '..', 'generated')
const write = (name, data) => writeFileSync(join(dir, `${name}.json`), JSON.stringify(data, null, 2))
const parseInfo = e => {
  const titleMatch = e.title.match(/([\w\s]+?)?\s?#(\d+) - (.*)/)
  const [, categoryName = 'News', number, titlePlain] = titleMatch ? titleMatch : [,,,e.title]

  const blockMatch = e.contentSnippet.match(/Blockzeit\s(\d+)/)
  const block = blockMatch ? parseInt(blockMatch[1]) : null
  const category = categoryName.toLowerCase().replace(/\W/, '-')

  return { block, category, categoryName, number, titlePlain }
}

;(async () => {
  const parser = new Parser()
  const feed = await parser.parseURL('https://anchor.fm/s/d8d3c38/podcast/rss')

  // Original Anchor-Feed
  write('feed', feed)

  // All episodes
  const episodes = feed.items.map(e => ({
    title: e.title.trim(),
    content: e.content.trim(),
    anchor: e.link,
    date: e.isoDate,
    enclosure: e.enclosure,
    duration: e.itunes.duration,
    image: e.itunes.image,
    season: e.itunes.season,
    episode: e.itunes.episode,
    guid: e.guid,
    ...parseInfo(e)
  }))

  write('episodes', episodes)
})()
