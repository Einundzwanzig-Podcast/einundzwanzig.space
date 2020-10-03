const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const Parser = require('rss-parser')

const dir = resolve(__dirname, '..')
const dst = join(dir, 'feed.json')

;(async () => {
  const parser = new Parser()
  const feed = await parser.parseURL('https://anchor.fm/s/d8d3c38/podcast/rss')

  writeFileSync(dst, JSON.stringify(feed, null, 2))
})()
