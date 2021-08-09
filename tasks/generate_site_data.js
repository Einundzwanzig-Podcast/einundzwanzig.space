const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const request = require('sync-request')

const meta = require('../content/meta.json')
const soundboard = require('../content/soundboard.json')

const dir = resolve(__dirname, '..', 'generated')
const dst = join(dir, 'site-data.json')

let recentBlocks = []
try {
  const jsonBody = request('GET', 'https://mempool.observer/api/recentBlocks').getBody('utf8')
  recentBlocks = JSON.parse(jsonBody)
} catch (err) {
  console.error('Could not load recent blocks:', err)
}

const block = recentBlocks.length && recentBlocks[0].height
const date = (new Date()).toJSON().split('T')[0]
const data = { date, block, meta }

writeFileSync(dst, JSON.stringify(data, null, 2))

const content = soundboard.map(group => {
  group.sounds = group.sounds.map(sound => {
    sound.url = `https://einundzwanzig.space${sound.file}`
    delete sound.file
    return sound
  })
  return group
})

const soundDst = resolve(__dirname, '..', 'dist', 'sounds.json')
writeFileSync(soundDst, JSON.stringify(content, null, 2))
