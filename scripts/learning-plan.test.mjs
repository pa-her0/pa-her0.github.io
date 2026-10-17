import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'
import { build } from 'esbuild'

const result = await build({
  stdin: {
    contents: 'export * from "./src/data/learning-plan"; export * from "./src/lib/learning-progress"; export * from "./src/lib/learning-insights";',
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
})
const { learningTracks, learningTasks, normalizeLearningProgress, resolveLearningTrackId, getTrackStats, buildLearningInsights } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)

test('the three competitions share one direction without changing or duplicating task IDs', () => {
  assert.deepEqual(learningTracks.map((track) => track.id), ['algorithm', 'ai-infra', 'agent'])
  const algorithm = learningTracks.find((track) => track.id === 'algorithm')
  assert.deepEqual(algorithm.groups.map((group) => group.unitIds.length), [10, 10, 2])
  const unitIds = algorithm.groups.flatMap((group) => group.unitIds)
  assert.deepEqual(unitIds, algorithm.units.map((unit) => unit.id))
  assert.equal(new Set(learningTasks.map((task) => task.id)).size, learningTasks.length)
  for (const id of ['nowcoder-1-a', 'hdu-1-1001', 'regional-vp-ccpc-review']) {
    assert.equal(learningTasks.find((task) => task.id === id)?.trackId, 'algorithm')
  }
})

test('old drafts retain completion dates, unfinished selections and all three notes', () => {
  const completedAt = { 'nowcoder-1-a': '2026-10-01', 'hdu-1-1001': '2026-10-02', 'regional-vp-icpc-select': '2026-10-03' }
  const migrated = normalizeLearningProgress({
    updatedAt: '2026-10-03T12:00:00Z', dailyGoal: 10, completedAt,
    currentTaskByTrack: { nowcoder: 'nowcoder-1-a', hdu: 'hdu-1-1004', 'regional-vp': 'regional-vp-ccpc-select', 'ai-infra': 'ai-infra-0-python' },
    statusNoteByTrack: { nowcoder: '牛'.repeat(240), hdu: '杭'.repeat(240), 'regional-vp': '赛'.repeat(240) },
  })
  assert.deepEqual(migrated.completedAt, completedAt)
  assert.equal(migrated.currentTaskByTrack.algorithm, 'hdu-1-1004')
  assert.equal(migrated.currentTaskByTrack['ai-infra'], 'ai-infra-0-python')
  assert.equal(migrated.dailyGoal, 10)
  for (const text of ['牛'.repeat(240), '杭'.repeat(240), '赛'.repeat(240)]) assert.ok(migrated.statusNoteByTrack.algorithm.includes(text))
  assert.deepEqual(normalizeLearningProgress(migrated), migrated)
  assert.equal(getTrackStats('algorithm', migrated).completed, 3)
  assert.equal(buildLearningInsights(migrated, learningTracks, '2026-10-04').records.length, 3)
})

test('canonical edits win over old aliases; invalid cross-direction tasks are rejected', () => {
  const canonical = normalizeLearningProgress({
    currentTaskByTrack: { algorithm: 'regional-vp-ccpc-select', nowcoder: 'nowcoder-1-c', 'ai-infra': 'nowcoder-1-c' },
    statusNoteByTrack: { algorithm: '', nowcoder: 'old note' },
  })
  assert.equal(canonical.currentTaskByTrack.algorithm, 'regional-vp-ccpc-select')
  assert.equal(canonical.currentTaskByTrack['ai-infra'], undefined)
  assert.equal(canonical.statusNoteByTrack.algorithm, '')
  for (const alias of ['nowcoder', 'hdu', 'regional-vp', 'algorithm']) assert.equal(resolveLearningTrackId(alias), 'algorithm')
  assert.equal(resolveLearningTrackId('ai-infra'), 'ai-infra')
  assert.equal(resolveLearningTrackId('unknown'), undefined)
})

test('CS336 has all 16 requested descriptions in order and independent completion state', () => {
  const infra = learningTracks.find((track) => track.id === 'ai-infra')
  const course = infra.units.find((unit) => unit.id === 'ai-infra-cs336')
  assert.equal(course.tasks.length, 16)
  assert.match(course.tasks[0].label, /Overview, tokenization \[Percy\]/)
  assert.match(course.tasks[1].label, /FLOPs, memory, arithmetic intensity/)
  assert.match(course.tasks[6].label, /Parallelism \[Percy\]/)
  assert.match(course.tasks[7].label, /Parallelism \[Tatsu\]/)
  assert.match(course.tasks[15].label, /Post-training - RLVR \[Tatsu\]/)
  assert.ok(course.href.startsWith('https://www.youtube.com/'))
  const progress = normalizeLearningProgress({ completedAt: { [course.tasks[6].id]: '2026-10-17' }, currentTaskByTrack: { 'ai-infra': course.tasks[7].id } })
  assert.equal(getTrackStats('ai-infra', progress).completed, 1)
  assert.equal(progress.completedAt[course.tasks[7].id], undefined)
  assert.deepEqual(normalizeLearningProgress(progress), progress)
})

test('the published snapshot retains every recorded completion after migration', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../src/data/learning-progress.json', import.meta.url), 'utf8'))
  const progress = normalizeLearningProgress(snapshot)
  assert.deepEqual(progress.completedAt, snapshot.completedAt)
  const counted = learningTracks.reduce((total, track) => total + getTrackStats(track.id, progress).completed, 0)
  assert.equal(counted, Object.keys(snapshot.completedAt).length)
})
