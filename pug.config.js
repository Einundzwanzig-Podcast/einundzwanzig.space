// initialize markdown rendering
const renderMarkdown = require('./markdown')

const random = max =>  Math.floor(Math.random() * Math.floor(max))
const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * i); const temp = arr[i]; arr[i] = arr[j]; arr[j] = temp; }; return arr }
const formatDate = date => (new Date(date)).toISOString().replace(/T.*/, '').split('-').reverse().join('.')
const linkTarget = url => url.startsWith('http') ? '_blank' : null
const assetPath = path => {
  let revs
  try { revs = require('./generated/rev.json') } catch (error) { }
  return `${(revs && revs[path]) || path}`
}
const assetUrl = (path, protocol = 'https') => {
  const base = path.startsWith('http') ? '' : `${protocol}://einundzwanzig.space`
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
  renderMarkdown,
}
