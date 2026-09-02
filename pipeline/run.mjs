// Orchestrator: collect -> analyze -> validate -> write public/data/signals.json
//
// Safety contract: if ANY step fails, exit non-zero WITHOUT touching the
// existing signals.json, so the dashboard keeps serving the last good data.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collect } from './collect.mjs'
import { analyze } from './analyze.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, '..', 'public', 'data', 'signals.json')

async function main() {
  const startedAt = Date.now()

  console.log('› collecting feeds…')
  const { articles, stats, failures } = await collect()
  if (failures.length) {
    for (const f of failures) console.warn(`  ! feed failed: ${f.feed} — ${f.error}`)
  }
  console.log(`  ${stats.articlesFetched} articles from ${stats.feedsScanned - stats.feedsFailed}/${stats.feedsScanned} feeds`)
  if (!articles.length) throw new Error('No articles collected — refusing to overwrite existing data')

  console.log('› analyzing with Gemini…')
  const { signals, modelId } = await analyze(articles)
  console.log(`  ${signals.length} signals produced (model=${modelId})`)

  const payload = {
    generatedAt: new Date().toISOString(),
    stats: {
      feedsScanned: stats.feedsScanned,
      feedsFailed: stats.feedsFailed,
      articlesFetched: stats.articlesFetched,
      signalsProduced: signals.length,
      durationMs: Date.now() - startedAt,
      model: modelId,
    },
    signals,
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(`✓ wrote ${path.relative(process.cwd(), OUT)}`)
}

main().catch((err) => {
  console.error(`✗ pipeline failed: ${err.message}`)
  console.error('  existing signals.json left untouched.')
  process.exit(1)
})
