const { statSync, writeFileSync } = require('fs')
const { join, resolve } = require('path')
const request = require('sync-request')
const episodes = require('../generated/episodes.json')

const dir = process.env.EPISODES_DIR || resolve(__dirname, '..', 'episodes')
const write = (name, data) => writeFileSync(join(dir, name), data)
const exists = filePath => {
  try {
    const stat = statSync(filePath)
    return stat.isFile() || stat.isDirectory()
  } catch (err) {
    return false
  }
}

const download = (url, name) => {
  const filePath = join(dir, name)
  if (exists(filePath)) {
    console.log(`${name} already exists`)
  } else {
    console.log(`Downloading ${name}`)
    write(name, request('GET', url).getBody())
  }
}

episodes.forEach(e => {
  const { slug, enclosure: { url: mp3Url }, image: imgUrl } = e
  if (mp3Url.startsWith('http')) download(mp3Url, `${slug}.mp3`)
  if (imgUrl.startsWith('http')) download(imgUrl, `${slug}.jpg`)
})
