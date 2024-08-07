const { readdirSync, writeFileSync } = require('fs')
const { basename, join, resolve } = require('path')
const request = require('sync-request')
const { toMeetupMapInfo } = require('../helpers')
const meta = require('../content/meta.json')
const soundboard = require('../content/soundboard.json')

const loadJson = url => {
  const jsonBody = request('GET', url).getBody('utf8')
  return JSON.parse(jsonBody)
}

const dir = (...path) => resolve(__dirname, '..', ...path)
const writeJSON = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2))

let recentBlocks = []
try {
  recentBlocks = loadJson('https://mempool.observer/api/recentBlocks')
} catch (err) {
  console.error('Could not load recent blocks:', err)
}

const block = recentBlocks.length && recentBlocks[0].height
const now = new Date()
const date = now.toJSON().split('T')[0]

// Meetups
let meetups = []
try {
  meetups = loadJson('https://portal.einundzwanzig.space/api/meetups')
} catch (err) {
  console.error('Could not load meetups:', err)
  meetups = require('../content/meetups-do-not-edit.json')
}

const sortId = m => `${m.country === 'DE' ? '0' : m.country}-${m.name}`
meetups = meetups
  .sort((a, b) => sortId(a) > sortId(b) ? 1 : -1)
  .map(toMeetupMapInfo)

const upcomingMeetups = meetups.filter(m => m.event && new Date(m.event.start) >= now)
  .sort((a, b) => new Date(a.event.start) > new Date(b.event.start) ? 1 : -1)

writeJSON(dir('dist', 'meetups.json'), meetups)

writeJSON(dir('generated', 'site-data.json'), {
  date,
  block,
  meta,
  meetups,
  upcomingMeetups
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
