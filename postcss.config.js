const mediaVariables = require('postcss-media-variables')

module.exports = {
  plugins: [
    require('autoprefixer'),
    require('postcss-import'),
    require('postcss-nesting'),
    mediaVariables,
    require('postcss-custom-media'),
    require('postcss-calc'),
    mediaVariables,
  ],
}
