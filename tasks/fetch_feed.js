const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const { replacements, slugify } = require('../helpers')
const { masterFeedUrl, publicFeedUrl } = require('../content/meta.json')
const request = require('sync-request')
const Parser = require('rss-parser')

const dir = resolve(__dirname, '..')
const write = (name, data) => writeFileSync(join(dir, name), data)
const writeJSON = (name, data) => write(`generated/${name}.json`, JSON.stringify(data, null, 2))

const parseBaseInfoFromMatch = m => {
  let [, categoryName = 'News', number, titlePlain] = m ? m : [,,,]
  if (!number) categoryName = 'Verschiedenes'
  if (categoryName === 'Der-Weg') categoryName = 'Der Weg'
  return { categoryName, number, titlePlain }
}

const parseInfo = e => {
  const titleMatch = e.title.match(/([\w\s]+?)?\s?#(\d+) - (.*)/) || [,,,e.title]
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
    const image = ['interview', 'lesestunde', 'verschiedenes'].includes(info.category) ? e.itunes.image : `/img/cover/${info.category}.png`
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
    .replace('xmlns:anchor="https://anchor.fm/xmlns"', 'xmlns:anchor="https://anchor.fm/xmlns" xmlns:podcast="https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md"')
    .replace('<channel>', `<channel>
	<podcast:value type="lightning" method="keysend" suggested="0.00000005000">
			<podcast:valueRecipient name="Dennis (Podcaster)" type="node" address="0231f73aef9bbdbf69e840640255946264026b56e17701f2d410b08b8b6e5d637a" split="19" />
			<podcast:valueRecipient name="Fab (Podcaster)" type="node" address="03f14237bb08f0afcb1ea07eff6b0b41e79294e66888971cccf1f585f5e21bf8f9" split="19" />
			<podcast:valueRecipient name="Gigi (Podcaster)" type="node" address="02e12fea95f576a680ec1938b7ed98ef0855eadeced493566877d404e404bfbf52" split="19" />
			<podcast:valueRecipient name="Markus (Podcaster)" type="node" address="0286e50ebeaafdf7dc321f6c8cb7e964e236b03ed67494b6337215c5c3c42252f2" split="19" />
      <podcast:valueRecipient name="Daniel (Podcaster)" type="node" address="0201d14101401add234ebe3bc0e3020a39726daadf82bc3fa6b9871c4f5b17ab3f" split="19" />
			<podcast:valueRecipient name="Podcastindex.org (Donation)" type="node" address="03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425ac605e61a4a" split="5" />
	</podcast:value>`)
  write('dist/feed.xml', updated)
})()
