const { replacements, slugify, stripHTML, participantsWithAliases, participantToId, assetUrl, write, writeJSON } = require('../helpers')
const { masterFeedUrl, publicFeedUrl, nodeId, title: podcastName } = require('../content/meta.json')
const participantsRaw = require('../content/participants.json')
const request = require('sync-request')
const { XMLParser } = require('fast-xml-parser')

const debug = process.env.CI

const participants = participantsWithAliases(participantsRaw)

const xml2jsonOpts = {
  attributeNamePrefix: '',
  attributesGroupName: '__attr',
  ignoreAttributes: false,
  cdataPropName: '__cdata',
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false
}

const regexBlockzeit = /Blockzeit\s(\d+(?:\.)?\d+)/

const parser = new XMLParser(xml2jsonOpts, true)

const parseEpisode = e => {
  const guid = e.guid['#text']
  const title = e.title.__cdata.trim()
  const description = replacements(e.description.__cdata).trim()
  const descriptionPlain = stripHTML(description)
  let [, categoryName = 'News', number, titlePlain] = title.match(
    /([\w\s]+?)?\s?#(\d+) - (.*)/
  ) || [, , , title]
  if (!number) categoryName = 'Verschiedenes'
  if (categoryName === 'Der-Weg') categoryName = 'Der Weg'
  if (categoryName === 'On-Tour') categoryName = 'On Tour'
  if (categoryName === 'Buchclub') categoryName = 'Lesestunde'
  if (categoryName === 'reCATion') categoryName = 'Verschiedenes'
  if (categoryName === 'NostrTalk') categoryName = 'NostrTalk'
  if (categoryName === 'FilterFrei') categoryName = 'FilterFrei'
  const lines = descriptionPlain.trim().split('\n')
  const firstLine = lines.length === 1
    ? stripHTML(description.match(/^.*?<\/p>/)[0] || '')
    : lines.find(l => l.match(regexBlockzeit)) || lines[0] || ''
  const blockMatch = firstLine.match(regexBlockzeit)
  const block = blockMatch ? parseInt(blockMatch[1].replace('.', '')) : null
  const category = slugify(categoryName)
  const slug = slugify(`${categoryName} ${number || ''} ${titlePlain}`)
  const date = new Date(e.pubDate)
  const img = e['itunes:image'].__attr.href
  const image = ['interview', 'lesestunde', 'on-tour', 'nostrtalk', 'filterfrei', 'verschiedenes'].includes(category)
    ? img
    : `/img/cover/${category}.png`
  const duration = e['itunes:duration']
  const enclosure = e.enclosure.__attr
  const [, participantsString, additionalString] =
    firstLine.match(/[-–—]\s?(?:(?:(?:von\sund\s)?mit\s)|(?:gelesen\svon\s))([^.]*)/i) || []
  const participants = participantsString
    ? participantsString
        .replace(/(\s*,\s*|\s*und\s*|\s*sowie\s*|\s*&amp;\s*)/gi, '%')
        .trim()
        .split('%')
        .filter(p => !!p)
        .map(p => p.trim())
    : []
  return {
    block,
    category,
    categoryName,
    number,
    title,
    titlePlain,
    description,
    descriptionPlain,
    duration,
    slug,
    image,
    guid,
    date,
    enclosure,
    participants
  }
}

;(async () => {
  // Load and adapt feed
  const anchorXML = request('GET', masterFeedUrl).getBody('utf8')
  const xml = anchorXML
    .replace(/\u2060/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2019/g, "'")
    .replace(`"${masterFeedUrl}"`, `"${publicFeedUrl}"`)
    .replace(
      'xmlns:anchor="https://anchor.fm/xmlns"',
      'xmlns:anchor="https://anchor.fm/xmlns" xmlns:podcast="https://podcastindex.org/namespace/1.0"'
    )
    .replace('<channel>', '<channel><podcast:value></podcast:value>')

  const feed = parser.parse(xml)
  const episodes = []
  const _noParticipants = [], _noNode = []

  // remove invalid tag
  delete feed.rss.channel.author

  // podcast
  feed.rss.channel['podcast:value'] = {
    __attr: {
      type: 'lightning',
      method: 'keysend'
    },
    'podcast:valueRecipient': [{
      __attr: {
        name: 'Einundzwanzig',
        type: 'node',
        split: 100,
        address: nodeId
      }
    }]
  }

  // episodes
  feed.rss.channel.item = feed.rss.channel.item.map((item, index) => {
    const episode = parseEpisode(item)
    episodes.push(episode)

    const episodePath = `podcast/${episode.slug}`
    const link = `https://einundzwanzig.space/${episodePath}`
    let { description, descriptionPlain } = episode
    if (index > 20) {
      description = `Shownotes: ${link}`
      descriptionPlain = `Shownotes: ${link}`
    }

    const updated = {
      ...item,
      link, // replace Anchor link
      description: { __cdata: description },
    }
    // itunes:summary seems to be gone: https://help.apple.com/itc/podcasts_connect/#/itcb54353390
    delete updated['itunes:summary']

    if (episode.number) {
      updated['podcast:episode'] = {
        __attr: {
          display: `${episode.categoryName} #${episode.number}`
        },
        '#text': episode.number
      }
    }

    const value = episode.participants.reduce((result, name) => {
      const id = participantToId(name)
      const v4v = participants[id] && participants[id].v4v
      if (v4v) {
        result.push({ name, ...v4v })
      } else if (debug) {
        _noNode.push({ episode: episode.slug, name })
      }
      return result
    }, [])

    if (value.length) {
      updated['podcast:value'] = {
        __attr: {
          type: 'lightning',
          method: 'keysend'
        },
        'podcast:valueRecipient': value.map(p => ({
          __attr: {
            ...p,
            type: 'node',
            split: Math.round(100 / value.length)
          }
        }))
      }
    } else if (debug) {
      _noParticipants.push({ episode: episode.slug })
    }

    const people = episode.participants.reduce((result, name) => {
      const id = participantToId(name)
      const person = participants[id]
      if (person) {
        result.push(person)
      }
      return result
    }, [])

    if (people.length) {
      updated['podcast:person'] = []

      people.forEach(p => {
        const __attr = {}
        if (p.image) __attr.img = assetUrl(p.image)
        if (p.url) __attr.href = p.url
        else if (p.nostr) __attr.href = `https://njump.me/${p.nostr}`
        else if (p.twitter) __attr.href = `https://x.com/${p.twitter}`
        updated['podcast:person'].push({
          __attr,
          '#text': p.name
        })
      })
    }

    // chapters
    const chapterInfo = descriptionPlain.match(/(\d{1,2}:\d{2}:\d{2})\s(.*)/g)
    if (chapterInfo) {
      try {
        const chapters = chapterInfo.map(chapter => {
          const [_, hms, title] = chapter.match(/(\d{1,2}:\d{2}:\d{2})\s(.*)/)
          const [h, m, s] = hms.split(':')
          const startTime = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s)
          return { startTime, title }
        })
        const chapterData = { version: '1.2.0', podcastName, title: episode.title, chapters }
        write(`dist/${episodePath}/chapters.json`, JSON.stringify(chapterData, null, 2))
        updated['podcast:chapters'] = {
          __attr: { url: `${link}/chapters.json`, type: 'application/json+chapters' }
        }
      }
      catch (e) {
        console.error('Error generating chapters for', episode.slug, chapterInfo)
      }
    }

    return updated
  })

  writeJSON('feed', feed)
  writeJSON('episodes', episodes)
  console.log('Neueste Episode:', episodes[0].title, '-', episodes[0].date)

  if (_noParticipants.length) {
    console.log('Keine Teilnehmerliste')
    console.table(_noParticipants)
  }
  if (_noNode.length) {
    console.log('Teilnehmer ohne Node')
    console.table(_noNode)
  }
})()
