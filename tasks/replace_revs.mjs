import { resolve }  from 'path'
import { replaceInFileSync } from 'replace-in-file'
import rev from '../generated/rev.json' with { type: 'json' }

const { dirname } = import.meta
const options = {
  files: [resolve(dirname, '../dist/**/*.xml'), resolve(dirname, '../dist/**/*.html')],
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
