const { readdirSync, writeFileSync } = require('fs')
const { basename, join, resolve } = require('path')
const request = require('sync-request')

const meta = require('../content/meta.json')
const meetups = require('../content/meetups.json')
const soundboard = require('../content/soundboard.json')

const { TELEGRAM_BOT_TOKEN } = process.env

const dir = (...path) => resolve(__dirname, '..', ...path)
const writeJSON = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2))

let recentBlocks = []
try {
  const jsonBody = request('GET', 'https://mempool.observer/api/recentBlocks').getBody('utf8')
  recentBlocks = JSON.parse(jsonBody)
} catch (err) {
  console.error('Could not load recent blocks:', err)
}

const block = recentBlocks.length && recentBlocks[0].height
const date = (new Date()).toJSON().split('T')[0]

// Meetups
const meetup = meetups.map(m => {
  const copy = Object.assign({}, m)

  if (TELEGRAM_BOT_TOKEN) {
    let { telegramId } = m
    if (!telegramId && m.url.startsWith('https://t.me/')) {
      [,, telegramId] = m.url.match(/:\/\/t\.me\/(?!(\+|joinchat))(.*)/) || []
      if (telegramId) {
        try {
          const jsonBody = request(
            'GET',
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMemberCount?chat_id=@${telegramId}`
          ).getBody('utf8')
          const { ok, result } = JSON.parse(jsonBody)
          if (ok) {
            copy.telegramId = telegramId
            copy.members = result
          }
        } catch (err) {
        }
      }
    }
  }

  return copy
})

writeJSON(dir('dist', 'meetups.json'), meetup)

writeJSON(dir('generated', 'site-data.json'), {
  date,
  block,
  meta,
  meetups: meetup,
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
