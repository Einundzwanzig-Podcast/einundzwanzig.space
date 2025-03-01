
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
const builder = new XMLBuilder(json2xmlOpts)

// Load and adapt feed
const outputXML = builder.build(feed)
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
