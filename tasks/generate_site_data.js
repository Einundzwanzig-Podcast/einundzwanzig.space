const { readdirSync, writeFileSync } = require('fs')
const { basename, join, resolve } = require('path')
const request = require('sync-request')

const meta = require('../content/meta.json')
const team = require('../content/team.json')
const meetups = require('../content/meetups.json')
const soundboard = require('../content/soundboard.json')

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

writeJSON(dir('generated', 'site-data.json'), { date, block, meta })

// Participants
const participants = team.reduce((result, person) => Object.assign(result, { [person.name]: person }), {})
writeJSON(dir('generated', 'participants.json'), participants)

// Meetups
const meetup = meetups.map(m => {
  const copy = Object.assign({}, m)
  delete copy.top
  delete copy.left
  return copy
})

writeJSON(dir('dist', 'meetups.json'), meetup)

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
