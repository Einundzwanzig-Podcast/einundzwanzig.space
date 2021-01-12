// configure markdown-it
const transformer = require('jstransformer')
const { _tr: mdTransformer } = transformer(require('jstransformer-markdown-it'))

const config = {
  typographer: true,
}

// monkey-patch render function to pass custom options
const { render: renderMd } = mdTransformer

mdTransformer.render = str => renderMd(str, config)

// replacements
const replacements = str => {
  return str.replace(/"https:\/\/twitter\.com\/_d11n_\/?"/, '"https://bitcoinhackers.org/@d11n"')
}

module.exports = {
  markdown: mdTransformer.render,
  replacements
}
