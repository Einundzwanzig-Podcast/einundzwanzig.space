// initialize markdown rendering
const helpers = require('./helpers')

const IS_DEV = process.env.NODE_ENV === 'development'
const HOST = IS_DEV ? 'http://localhost:3000' : 'https://einundzwanzig.space'
const random = max =>  Math.floor(Math.random() * Math.floor(max))
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); const temp = arr[i]; arr[i] = arr[j]; arr[j] = temp; }; return arr }
const formatDate = date => (new Date(date)).toISOString().replace(/T.*/, '').split('-').reverse().join('.')
const linkTarget = url => url.startsWith('http') ? '_blank' : null
const assetPath = path => {
  if (path.startsWith('http')) return path
  let revs
  try { revs = require('./generated/rev.json') } catch (error) { }
  return `${(revs && revs[path]) || path}`
}
const assetUrl = (path, protocol = 'https') => {
  if (IS_DEV && !path.startsWith('http')) protocol = 'http'
  const base = path.startsWith('http') ? '' : HOST
  let url = `${base}${assetPath(path)}`
  if (!url.startsWith(`${protocol}:`)) url = url.replace(/^.*:/, `${protocol}:`)
  return url
}

module.exports = {
  basedir: './src/includes',
  random,
  shuffle,
  assetUrl,
  assetPath,
  formatDate,
  linkTarget,
  ...helpers
}
