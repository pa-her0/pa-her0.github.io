import assert from "node:assert/strict"
import test from "node:test"

import { homeDashboard } from "../src/data/home-dashboard.ts"

test("homepage music mirrors the configured NetEase playlist and uses only secure preview sources", () => {
  assert.equal(homeDashboard.playlist.id, "13584583094")
  assert.equal(homeDashboard.tracks.length, 10)

  for (const track of homeDashboard.tracks) {
    assert.equal(new URL(track.href).protocol, "https:")
    assert.equal(new URL(track.cover).protocol, "https:")
    const source = new URL(track.src)
    assert.equal(source.protocol, "https:")
    assert.equal(source.hostname, "audio-ssl.itunes.apple.com")
    assert.match(track.mimeType, /^audio\/mp4/)
  }
})
