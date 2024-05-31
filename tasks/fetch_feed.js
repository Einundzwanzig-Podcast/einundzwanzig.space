const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const { replacements, slugify, stripHTML, teamWithAliases, participantToId } = require('../helpers')
const { masterFeedUrl, publicFeedUrl, nodeId } = require('../content/meta.json')
const teamRaw = require('../content/team.json')
const request = require('sync-request')
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser')
const xmlFormat = require('xml-formatter')

const debug = process.env.CI
const dir = resolve(__dirname, '..')
const write = (name, data) => writeFileSync(join(dir, name), data)
const writeJSON = (name, data) =>
  write(`generated/${name}.json`, JSON.stringify(data, null, 2))

const team = teamWithAliases(teamRaw)

const commonOpts = {
  attributeNamePrefix: '',
  attributesGroupName: '__attr',
  ignoreAttributes: false,
  cdataPropName: '__cdata'
}

const xml2jsonOpts = {
  ...commonOpts,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false
}

const json2xmlOpts = {
  ...commonOpts,
  indentBy: '  '
}

const regexBlockzeit = /Blockzeit\s(\d+(?:\.)?\d+)/

const parser = new XMLParser(xml2jsonOpts, true)
const builder = new XMLBuilder(json2xmlOpts)

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
  const firstLine = descriptionPlain.split('\n').find(l => l.match(regexBlockzeit)) || ''
  const blockMatch = firstLine.match(regexBlockzeit)
  const block = blockMatch ? parseInt(blockMatch[1].replace('.', '')) : null
  const category = slugify(categoryName)
  const slug = slugify(`${categoryName} ${number || ''} ${titlePlain}`)
  const date = new Date(e.pubDate)
  const img = e['itunes:image'].__attr.href
  const image = ['interview', 'lesestunde', 'on-tour', 'nostrtalk', 'verschiedenes'].includes(category)
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

    const link = `https://einundzwanzig.space/podcast/${episode.slug}`
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
      const v4v = team[id] && team[id].v4v
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
      const person = team[id]
      if (person) {
        result.push(person)
      }
      return result
    }, [])

    if (people.length) {
      updated['podcast:person'] = []

      people.forEach(p => {
        let href = p.url
        if (!href && p.nostr) href = `https://snort.social/p/${p.nostr}`
        if (!href && p.twitter) href = `https://twitter.com/${p.twitter}`
        updated['podcast:person'].push({
          __attr: { href },
          '#text': p.name
        })
      })
    }

    return updated
  })

  const outputXML = builder.build(feed)

  writeJSON('episodes', episodes)

  const validation = XMLValidator.validate(outputXML)
  if (validation) {
    write(
      'dist/feed.xml',
      xmlFormat(outputXML, {
        indentation: json2xmlOpts.indentBy,
        collapseContent: true
      })
    )
  } else {
    console.error(validation.err)
  }

  if (_noParticipants.length) {
    console.log('Keine Teilnehmerliste')
    console.table(_noParticipants)
  }
  if (_noNode.length) {
    console.log('Teilnehmer ohne Node')
    console.table(_noNode)
  }
})()
