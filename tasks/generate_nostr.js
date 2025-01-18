const { mkdirSync, writeFileSync } = require('fs')
const { dirname, resolve } = require('path')
const { NDKUser } = require('@nostr-dev-kit/ndk')
const participants = require('../content/participants.json')
const { npub } = require('../content/meta.json')

const einundzwanzig = new NDKUser({ npub: npub.einundzwanzig })
const nostrtalk = new NDKUser({ npub: npub.nostrTalk })
const zitadelle = new NDKUser({ npub: npub.zitadelle })
const names = {
  "_": einundzwanzig.pubkey,
  "einundzwanzig": einundzwanzig.pubkey,
  "nostrtalk": nostrtalk.pubkey,
  "zitadelle": zitadelle.pubkey
}
const relays = {
  [npub.einundzwanzig]: [
    "wss://nostr.einundzwanzig.space"
  ]
}

Object.entries(participants).forEach(([key, { nostr: npub }]) => {
  if (!npub) return
  const id = key.replace(/[\s]/g, '_')
  names[id] = new NDKUser({ npub }).pubkey
})

const dst = resolve(__dirname, '..', 'dist', '.well-known', 'nostr.json')
const dir = dirname(dst)
const res = { names, relays }

mkdirSync(dir, { recursive: true })
writeFileSync(dst, JSON.stringify(res, null, 2))
