// initialize markdown rendering
const renderMarkdown = require('./markdown')

const slugify = str => str.toLowerCase().replace(/\W/, '-')
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
  return `${protocol}://einundzwanzig.space/${assetPath(path)}`
}

module.exports = {
  basedir: './src/includes',
  random,
  shuffle,
  slugify,
  assetUrl,
  assetPath,
  formatDate,
  linkTarget,
  renderMarkdown,
}
