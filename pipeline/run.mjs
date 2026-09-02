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

// Load .env for local runs. In CI the values come from real environment
// variables (GitHub Secrets), so a missing .env file is not an error.
// Never overrides a variable that is already set.
function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (!m) continue
    const key = m[1]
    const value = m[2].replace(/^['"]|['"]$/g, '').trim()
    if (value && !process.env[key]) process.env[key] = value
  }
}
loadDotEnv()

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
