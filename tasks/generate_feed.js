
const { XMLBuilder, XMLValidator } = require('fast-xml-parser')
const xmlFormat = require('xml-formatter')
const { write } = require('../helpers')
const feed = require('../generated/feed.json')

const json2xmlOpts = {
  attributeNamePrefix: '',
  attributesGroupName: '__attr',
  ignoreAttributes: false,
  cdataPropName: '__cdata',
  indentBy: '  '
}

const PAGE_SIZE = 21

function writePage(feedJson, itemsSlice, pageIndex, totalPages) {
  const builder = new XMLBuilder(json2xmlOpts)
  const feedCopy = JSON.parse(JSON.stringify(feedJson))

  // Ensure channel.item is the page slice
  feedCopy.rss = feedCopy.rss || {}
  feedCopy.rss.channel = feedCopy.rss.channel || {}
  feedCopy.rss.channel.item = itemsSlice

  // Build atom links: adapt self, add prev/next where appropriate
  const origAtom = (feedJson.rss && feedJson.rss.channel && feedJson.rss.channel['atom:link']) || []
  const origSelf = Array.isArray(origAtom)
    ? (origAtom.find(l => l.__attr && l.__attr.rel === 'self') || {}).__attr
    : (origAtom && origAtom.__attr) || {}
  const originalHref = (origSelf && origSelf.href) || ''
  const base = originalHref.replace(/\/feed(?:-page-\d+)?\.xml$/, '')

  const pageNumber = pageIndex + 1
  const selfHref = pageIndex === 0 ? `${base}/feed.xml` : `${base}/feed-page-${pageNumber}.xml`

  const newAtom = []
  newAtom.push({ __attr: { href: selfHref, rel: 'self', type: 'application/rss+xml' } })
  // preserve hub if present
  const hub = Array.isArray(origAtom) && origAtom.find(l => l.__attr && l.__attr.rel === 'hub')
  if (hub) newAtom.push(hub)

  if (pageIndex > 0) {
    const prevHref = pageIndex === 1 ? `${base}/feed.xml` : `${base}/feed-page-${pageIndex}.xml`
    newAtom.push({ __attr: { href: prevHref, rel: 'prev', type: 'application/rss+xml' } })
  }

  if (pageIndex < totalPages - 1) {
    const nextHref = `${base}/feed-page-${pageNumber + 1}.xml`
    newAtom.push({ __attr: { href: nextHref, rel: 'next', type: 'application/rss+xml' } })
  }

  feedCopy.rss.channel['atom:link'] = newAtom

  const outputXML = builder.build(feedCopy)
  const validation = XMLValidator.validate(outputXML)
  if (validation) {
    const filename = pageIndex === 0 ? 'dist/feed.xml' : `dist/feed-page-${pageNumber}.xml`
    write(
      filename,
      xmlFormat(outputXML, {
        indentation: json2xmlOpts.indentBy,
        collapseContent: true
      })
    )
    return filename
  } else {
    console.error('XML validation error:', validation.err)
    return null
  }
}

// Main: split items and write pages
const items = (feed.rss && feed.rss.channel && feed.rss.channel.item) || []
const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
const written = []
for (let i = 0; i < totalPages; i++) {
  const start = i * PAGE_SIZE
  const slice = items.slice(start, start + PAGE_SIZE)
  const out = writePage(feed, slice, i, totalPages)
  if (out) written.push(out)
}

if (written.length) {
  console.log('Wrote paginated feeds:', written.join(', '))
} else {
  console.error('No feed files written')
}

// Additionally write a full archive feed with all items
function writeFullFeed(feedJson, allItems) {
  const builder = new XMLBuilder(json2xmlOpts)
  const feedCopy = JSON.parse(JSON.stringify(feedJson))

  feedCopy.rss = feedCopy.rss || {}
  feedCopy.rss.channel = feedCopy.rss.channel || {}
  feedCopy.rss.channel.item = allItems

  // preserve and adapt atom links
  const origAtom = (feedJson.rss && feedJson.rss.channel && feedJson.rss.channel['atom:link']) || []
  const origSelf = Array.isArray(origAtom)
    ? (origAtom.find(l => l.__attr && l.__attr.rel === 'self') || {}).__attr
    : (origAtom && origAtom.__attr) || {}
  const originalHref = (origSelf && origSelf.href) || ''
  const base = originalHref.replace(/\/feed(?:-page-\d+)?\.xml$/, '')

  const newAtom = []
  newAtom.push({ __attr: { href: `${base}/feed-all.xml`, rel: 'self', type: 'application/rss+xml' } })
  const hub = Array.isArray(origAtom) && origAtom.find(l => l.__attr && l.__attr.rel === 'hub')
  if (hub) newAtom.push(hub)
  feedCopy.rss.channel['atom:link'] = newAtom

  const outputXML = builder.build(feedCopy)
  const validation = XMLValidator.validate(outputXML)
  if (validation) {
    const filename = 'dist/feed-all.xml'
    write(
      filename,
      xmlFormat(outputXML, {
        indentation: json2xmlOpts.indentBy,
        collapseContent: true
      })
    )
    return filename
  } else {
    console.error('XML validation error (feed-all):', validation.err)
    return null
  }
}

const allOut = writeFullFeed(feed, items)
if (allOut) console.log('Wrote full archive feed:', allOut)
