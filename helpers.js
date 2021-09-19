const { decode } = require('html-entities')

// configure markdown-it
const transformer = require('jstransformer')
const { _tr: mdTransformer } = transformer(require('jstransformer-markdown-it'))

const config = {
  typographer: true,
  html: true
}

// monkey-patch render function to pass custom options
const { render: renderMd } = mdTransformer

mdTransformer.render = str => renderMd(str, config)

// replacements
const replacements = str => {
  return str && str.replace(/<\/?u>/g, '')
}

const stripHTML = str => {
  return str && decode(str.replace(/(<([^>]+)>)/ig, '').trim().replace(/\n\s*/g, '\n'))
}

// slug
const slugify = str => str.toLowerCase()
  .replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue')
  .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '')

const truncate = (str, wordCount) => {
  const words = str.trim().split(/\s(?![^\[]*\])/g)
  const head = words.splice(0, wordCount).join(' ')
  const tail = words.join(' ')
  return [head, tail]
}

module.exports = {
  markdown: mdTransformer.render,
  replacements,
  slugify,
  stripHTML,
  truncate
}
