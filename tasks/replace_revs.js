const { resolve } = require('path')
const { replaceInFileSync } = require('replace-in-file')
const rev = require('../generated/rev.json')
const options = {
  files: [resolve(__dirname, '../dist/**/*.xml'), resolve(__dirname, '../dist/**/*.html')],
  from: Object.keys(rev).map(key => new RegExp(key, 'g')),
  to: Object.values(rev)
}

try {
  const results = replaceInFileSync(options)
  console.log('Replacement results:', results.filter(result => result.hasChanged).length, 'files changed')
}
catch (error) {
  console.error('Replacement error occurred:', error)
}
