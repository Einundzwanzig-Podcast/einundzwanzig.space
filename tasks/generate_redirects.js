const { mkdirSync, statSync, writeFileSync } = require('fs')
const { dirname, join, resolve } = require('path')

const redirects = [
  ['/podcast/verschiedenes-special-zur-adoping-bitcoin-konferenz-in-el-salvador/', '/podcast/verschiedenes-special-zur-adopting-bitcoin-konferenz-in-el-salvador/'],
  ['/podcast/der-wer-33-bitcoin-hat-mich-umgepolt/', '/podcast/der-weg-33-bitcoin-hat-mich-umgepolt/']
]

const dist = resolve(__dirname, '..', 'dist')

const exists = filePath => {
  try {
    const stat = statSync(filePath)
    return stat.isFile() || stat.isDirectory()
  } catch (err) {
    return false
  }
}

redirects.forEach(([path, redirect]) => {
  const target = join(dist, path, 'index.html')
  if (exists(target)) return

  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `<!DOCTYPE html><html><title>Redirect</title><link rel="canonical" href="${redirect}"><script>location="${redirect}"</script><meta http-equiv="refresh" content="0;url=${redirect}"><meta name="robots" content="noindex"><a href="${redirect}">Click here if you are not redirected.</a></html>`)
})
