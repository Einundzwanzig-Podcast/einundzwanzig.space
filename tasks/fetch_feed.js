const { writeFileSync } = require('fs')
const { join, resolve } = require('path')
const { replacements, slugify, stripHTML  } = require('../helpers')
const { masterFeedUrl, publicFeedUrl } = require('../content/meta.json')
const nodes = require('../content/nodes.json')
const request = require('sync-request')
const parser = require('fast-xml-parser')
const JSON2XMLParser = require('fast-xml-parser').j2xParser
const xmlFormat = require('xml-formatter')
const he = require('he')

const debug = process.env.CI
const dir = resolve(__dirname, '..')
const write = (name, data) => writeFileSync(join(dir, name), data)
const writeJSON = (name, data) => write(`generated/${name}.json`, JSON.stringify(data, null, 2))

const commonOpts = {
  attributeNamePrefix: '',
  attrNodeName: '__attr',
  textNodeName: '#text',
  ignoreAttributes: false,
  cdataTagName: '__cdata',
  cdataPositionChar: '\\c'
}

const xml2jsonOpts = {
  ...commonOpts,
  ignoreNameSpace: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: true,
  parseTrueNumberOnly: false,
  arrayMode: false,
  numParseOptions: {
    hex: true,
    leadingZeros: true,
  },
  tagValueProcessor: val => he.decode(val),
  attrValueProcessor: val => he.decode(val, { isAttributeValue: true })
}

var json2xmlOpts = {
  ...commonOpts,
  format: false,
  indentBy: '  ',
  supressEmptyNode: false,
  tagValueProcessor: a => a,
  attrValueProcessor: a => he.encode(a, { isAttributeValue: true, useNamedReferences: true })
};

const parseEpisode = e => {
  const guid = e.guid['#text']
  const title = e.title.__cdata.trim()
  const content = replacements(e.description.__cdata).trim()
  const description = stripHTML(content)
  let [, categoryName = 'News', number, titlePlain] = title.match(/([\w\s]+?)?\s?#(\d+) - (.*)/) || [, , , title]
  if (!number) categoryName = 'Verschiedenes'
  if (categoryName === 'Der-Weg') categoryName = 'Der Weg'
  const firstLine = description.split('\n')[0]
  const blockMatch = firstLine.match(/Blockzeit\s(\d+)/)
  const block = blockMatch ? parseInt(blockMatch[1]) : null
  const category = slugify(categoryName)
  const slug = slugify(`${categoryName} ${number || ''} ${titlePlain}`)
  const date = new Date(e.pubDate)
  const img = e['itunes:image'].__attr.href
  const image = ['interview', 'lesestunde', 'verschiedenes'].includes(category) ? img : `/img/cover/${category}.png`
  const duration = e['itunes:duration']
  const enclosure = e.enclosure.__attr
  const [, participantsString] = firstLine.match(/ - (?:(?:von und )?mit )([^.]*)/i) || []
  const participants = participantsString ? participantsString.replace(/(\s*,\s*|\s*und\s*|\s*&amp;\s*)/ig, '%').trim().split('%') : []
  return { block, category, categoryName, number, title, titlePlain, description, content, duration, slug, image, guid, date, enclosure, participants }
}

;(async () => {
  // Load and adapt feed
  const anchorXML = request('GET', masterFeedUrl).getBody('utf8')
  const xml = anchorXML
    .replace(`"${masterFeedUrl}"`, `"${publicFeedUrl}"`)
    .replace('xmlns:anchor="https://anchor.fm/xmlns"', 'xmlns:anchor="https://anchor.fm/xmlns" xmlns:podcast="https://podcastindex.org/namespace/1.0"')
    .replace('<channel>', `<channel>
    <podcast:value type="lightning" method="keysend">
      <podcast:valueRecipient type="node" split="20" name="Dennis" address="${nodes.dennis}" />
      <podcast:valueRecipient type="node" split="20" name="Fab" address="${nodes.fab}" />
      <podcast:valueRecipient type="node" split="20" name="Gigi" address="${nodes.gigi}" />
      <podcast:valueRecipient type="node" split="20" name="Markus" address="${nodes.markus}" />
      <podcast:valueRecipient type="node" split="20" name="Daniel" address="${nodes.daniel}" />
    </podcast:value>`)

  const feed = parser.parse(xml, xml2jsonOpts, true)
  const episodes = []
  const _noParticipants = [], _noNode = []

  delete feed.rss.channel.author // remove invalid tag

  feed.rss.channel.item = feed.rss.channel.item.map(item => {
    const episode = parseEpisode(item)
    episodes.push(episode)

    const updated = {
      ...item,
      link: `https://einundzwanzig.space/podcast/${episode.slug}`, // replace Anchor link
      'itunes:summary': episode.description // please the validator, Anchor's itunes:summary contains HTML
    }

    const participants = episode.participants.reduce((result, name) => {
      const id = name.toLowerCase()
      const address = nodes[id]
      if (address) {
        result.push({ name, address })
      } else if (debug) {
        _noNode.push({ episode: episode.slug, name })
      }
      return result
    }, [])

    if (participants.length) {
      updated['podcast:value'] = {
        __attr: {
          type: 'lightning',
          method: 'keysend'
        },
        'podcast:valueRecipient': participants.map(p => ({
          __attr: {
            ...p,
            type: 'node',
            split: Math.round(100 / participants.length)
          }
        }))
      }
    } else if (debug) {
      _noParticipants.push({ episode: episode.slug })
    }

    return updated
  })

  writeJSON('feed', feed)

  const JSON2XML = new JSON2XMLParser(json2xmlOpts)
  const outputXML = JSON2XML.parse(feed)

  writeJSON('episodes', episodes)
  write('dist/feed.xml', xmlFormat(outputXML, { indentation: '  ', collapseContent: true }))
  write('static/feed.xml', xmlFormat(outputXML, { indentation: '  ', collapseContent: true }))

  if (_noParticipants.length) {
    console.log('Keine Teilnehmerliste')
    console.table(_noParticipants)
  }
  if (_noNode.length) {
    console.log('Teilnehmer ohne Node')
    console.table(_noNode)
  }
})()
