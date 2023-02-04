const { readdirSync, writeFileSync } = require('fs')
const { basename, join, resolve } = require('path')
const request = require('sync-request')

const meta = require('../content/meta.json')
const telegram = require('../content/telegram.json')
const soundboard = require('../content/soundboard.json')

const { TELEGRAM_BOT_TOKEN } = process.env
const loadJson = url => {
  const jsonBody = request('GET', url).getBody('utf8')
  return JSON.parse(jsonBody)
}

const dir = (...path) => resolve(__dirname, '..', ...path)
const writeJSON = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2))
const getTelegramMembersCount = group => {
  if (TELEGRAM_BOT_TOKEN) {
    const { name, url } = group
    if (url.startsWith('https://t.me/')) {
      [, , telegramId] = url.match(/:\/\/t\.me\/(?!(\+|joinchat))(.*)/) || []
      if (telegramId) {
        try {
          const { ok, result } = loadJson(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMemberCount?chat_id=@${telegramId}`)
          if (ok) {
            return result
          }
        } catch (err) {
          const [, description] = err.message.match(/"description":"(.*?)"/) || []
          console.error('Failed to get mebers count for', name, ' - ', description)
        }
      } else {
        console.log('No Telegram ID for', name, url)
      }
    }
  }
}

let recentBlocks = []
try {
  recentBlocks = loadJson('https://mempool.observer/api/recentBlocks')
} catch (err) {
  console.error('Could not load recent blocks:', err)
}

const block = recentBlocks.length && recentBlocks[0].height
const date = (new Date()).toJSON().split('T')[0]

// Telegram
const telegramData = telegram.map(t =>
  Object.assign(t, {
    members: getTelegramMembersCount(t),
  })
)

// Meetups
let meetups = []
try {
  meetups = loadJson('https://portal.einundzwanzig.space/api/meetups')
} catch (err) {
  console.error('Could not load meetups:', err)
  meetups = require('../content/meetups-do-not-edit.json')
}

writeJSON(dir('dist', 'meetups.json'), meetups)

writeJSON(dir('generated', 'site-data.json'), {
  date,
  block,
  meta,
  meetups,
  telegram: telegramData
})

// Soundboard
const sounds = soundboard.map(group => {
  group.sounds = group.sounds.map(sound => {
    sound.url = `https://einundzwanzig.space${sound.file}`
    delete sound.file
    return sound
  })
  return group
})

writeJSON(dir('dist', 'sounds.json'), sounds)

// Spendenregister
const spendenregisterDir = dir('content', 'spendenregister')
const spendenregister = readdirSync(spendenregisterDir).map(filename => {
  const filePath = join(spendenregisterDir, filename)
  const spende = require(filePath)
  spende.id = basename(filename, '.json')
  return spende
})

writeJSON(dir('generated', 'spendenregister.json'), spendenregister)
writeJSON(dir('dist', 'spendenregister.json'), spendenregister)
