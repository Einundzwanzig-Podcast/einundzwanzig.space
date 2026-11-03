const { mkdirSync, writeFileSync } = require('fs')
const { dirname, resolve } = require('path')
const { NDKUser } = require('@nostr-dev-kit/ndk')
const request = require('sync-request')
const participants = require('../content/participants.json')
const { npub } = require('../content/meta.json')

let members = []
try {
  const jsonBody = request('GET', 'https://verein.einundzwanzig.space/api/members/2026').getBody('utf8')
  members = JSON.parse(jsonBody)
} catch (err) {
  console.error('Could not load members:', err)
}

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

names['dennis-sync'] = new NDKUser({ npub: 'npub1u4xur24lmsrn7z9c8rkqxkmhvtf05c0r8u86urzwj6vu2fgfgccq7jrctw' }).pubkey

Object.entries(members).forEach(([key, { npub, pubkey, nip05_handle }]) => {
  if (!nip05_handle) return
  const id = nip05_handle.replace(/[\s]/g, '_')
  // don't overwrite participant entry
  if (names[id]) return
  names[id] = new NDKUser({ npub }).pubkey
})

const dst = resolve(__dirname, '..', 'dist', '.well-known', 'nostr.json')
const dir = dirname(dst)
const res = { names, relays }

mkdirSync(dir, { recursive: true })
writeFileSync(dst, JSON.stringify(res, null, 2))
