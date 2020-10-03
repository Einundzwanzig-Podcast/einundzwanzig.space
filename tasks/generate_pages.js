const pug = require('pug')
const { mkdirSync, writeFileSync } = require('fs')
const { dirname, resolve } = require('path')
const config = require('../pug.config')
const site = require('../site-data')
const feed = require('../feed.json')
const team = require('../content/team.json')

const renderPage = (name, out, data = {}) => {
  const file = resolve(__dirname, '..', `src/${name}.pug`)
  const options = Object.assign({}, config, { site }, data)
  const rendered = pug.renderFile(file, options)
  const dst = resolve(__dirname, '..', 'dist', `${out}.html`)
  const dir = dirname(dst)

  mkdirSync(dir, { recursive: true })
  writeFileSync(dst, rendered)
}

renderPage('index', 'index', { navCurrent: 'index' })
renderPage('team', 'team/index', { navCurrent: 'team', team })
renderPage('podcast', 'podcast/index', { navCurrent: 'podcast', feed })
