const pug = require('pug')
const { globSync } = require('glob')
const { writeFileSync } = require('fs')
const { resolve } = require('path')

const { DEPLOY_PRIME_URL, URL } = process.env
const BASE = DEPLOY_PRIME_URL || URL || 'https://einundzwanzig.space'

const html = globSync(resolve(__dirname, '..', `dist/**/*.html`))
const pages = html.map(file => file.replace(/.*\/dist/, BASE).replace(/index\.html$/, '')).filter(f => !f.endsWith('/kontakt/') && !f.endsWith('/datenschutz/'))
const now = (new Date()).toISOString()
const file = resolve(__dirname, '..', `src/sitemap.pug`)
const rendered = pug.renderFile(file, { pages, now, pretty: true })
const dst = resolve(__dirname, '..', 'dist', 'sitemap.xml')

writeFileSync(dst, rendered)
