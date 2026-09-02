// Dev utility: builds public/data/sample.json from a real collect() run so the
// bundled fallback cites genuine articles. The analyst text below is
// hand-written (clearly flagged as mode:"sample"); the live pipeline replaces
// it with Gemini output.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collect } from './collect.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Each entry matches supporting articles by a substring of their title.
const DEFS = [
  {
    match: ['สแกมเมอร์'],
    title: 'Scam losses keep denting digital-payment trust',
    summary:
      'Online scam losses reached 9.3 billion baht over seven months, and the damage is now being framed as a drag on confidence in the digital economy itself. The issue has moved from a consumer-protection story to an economic one.',
    soWhat:
      'Trust — not features — is becoming the binding constraint on digital payment growth, so fraud-prevention UX deserves roadmap space normally reserved for new products.',
    category: 'Social', impact: 5, confidence: 0.75, timeHorizon: 'Now',
    tags: ['fraud', 'digital payment', 'trust'],
  },
  {
    match: ['SmartSumer', 'ลาซาด้าเผยอินไซต์'],
    title: 'Thai shoppers screen purchases through AI before buying',
    summary:
      'Research points to around 90% of Thai consumers using AI tools to vet products before purchase, while marketplace data highlights "ask-AI-first" behaviour alongside emotional and reassurance-driven shopping. Discovery is shifting away from traditional search and ads.',
    soWhat:
      'If AI assistants now sit between the brand and the buyer, product data quality and machine-readability start to matter more than ad spend.',
    category: 'Consumer', impact: 4, confidence: 0.7, timeHorizon: 'Now',
    tags: ['AI', 'consumer behaviour', 'e-commerce'],
  },
  {
    match: ['เอสเอ็มอีไทยเร่งใช้ AI', 'จุดเปลี่ยนรับคลื่น AI'],
    title: 'SME AI adoption is blocked by legacy IT, not by willingness',
    summary:
      'Thai SMEs are accelerating AI adoption but repeatedly stall on internal IT constraints. Commentary is calling for local content and programmes that pull SMEs into the new value chain.',
    soWhat:
      'The winning SME product is integration-light — something that works on top of messy existing systems rather than demanding a platform migration.',
    category: 'Industry', impact: 4, confidence: 0.65, timeHorizon: '3-6mo',
    tags: ['SME', 'AI adoption', 'legacy IT'],
  },
  {
    match: ['next generation of AI startups', 'Ajaib'],
    title: 'Global AI and capital flow into the Thai startup ecosystem',
    summary:
      'International AI players are actively courting Thailand’s next wave of startups, while a Thai-founded venture raised roughly USD 270 million to become one of Southeast Asia’s most valuable startups. Outside capital and platform attention are arriving together.',
    soWhat:
      'Talent and distribution partnerships will get more competitive quickly — early positioning with these platforms is cheaper now than in twelve months.',
    category: 'Business', impact: 4, confidence: 0.7, timeHorizon: '3-6mo',
    tags: ['startup', 'funding', 'AI ecosystem'],
  },
  {
    match: ['Data Center ไทย', 'True Price of the Cloud'],
    title: 'Data-centre buildout runs into water and power limits',
    summary:
      'Thailand’s data-centre ambitions are being weighed against the strategic question of how to participate in the AI infrastructure wave. Reporting is surfacing the real resource cost in water and electricity.',
    soWhat:
      'Compute-heavy roadmaps carry an energy and sustainability exposure that will become a procurement and reputational issue, not just a cost line.',
    category: 'Industry', impact: 4, confidence: 0.6, timeHorizon: '1yr+',
    tags: ['data centre', 'energy', 'infrastructure'],
  },
  {
    match: ['ผ่าตัดใหญ่เศรษฐกิจไทย', 'หนุนไทยเร่งลงทุน', 'แถลงข่าวเศรษฐกิจ'],
    title: 'Policy pivots growth toward new industrial engines',
    summary:
      'Planners are pushing to escape a low-growth trap by accelerating four new engines — modern agriculture, upstream chips, pharma and medical devices, and future food. The central bank is simultaneously urging faster investment.',
    soWhat:
      'Public funding and incentives will concentrate in these four verticals, which is where partnership and pilot budgets are most likely to appear.',
    category: 'Economic', impact: 5, confidence: 0.7, timeHorizon: '1yr+',
    tags: ['policy', 'investment', 'industrial strategy'],
  },
  {
    match: ['CMDF', 'ฟินโนมีนา'],
    title: 'Capital-market vehicles mobilise behind the new economy',
    summary:
      'A 1-billion-baht PE trust is being set up to back startups and new-economy businesses, alongside further programmes to deepen the capital market. A major local WealthTech platform has filed for IPO.',
    soWhat:
      'A domestic exit path is opening up, which changes the calculus for founders who previously assumed offshore listing was the only route.',
    category: 'Business', impact: 3, confidence: 0.65, timeHorizon: '3-6mo',
    tags: ['capital markets', 'WealthTech', 'IPO'],
  },
  {
    match: ['อิปซอสส์', 'รู้จักลูกค้า รู้ลึกธุรกิจ'],
    title: 'Customer experience is slipping while AI fails to reassure',
    summary:
      'Research indicates Thai customer-experience quality has declined and that AI is not yet generating full customer confidence. In parallel, commentary stresses how quickly consumers now switch away.',
    soWhat:
      'Deploying AI into service journeys without a visible trust mechanism risks accelerating churn rather than reducing cost.',
    category: 'Consumer', impact: 3, confidence: 0.6, timeHorizon: 'Now',
    tags: ['CX', 'trust', 'retention'],
  },
  {
    match: ['วิจัยกรุงศรี'],
    title: 'Growth forecast nudged up on investment momentum',
    summary:
      'A major bank research house raised its Thai GDP forecast for the year on the back of investment momentum and government measures. The revision is modest but directionally positive.',
    soWhat:
      'A slightly better macro backdrop supports budget conversations that were previously deferred, particularly investment-led ones.',
    category: 'Economic', impact: 3, confidence: 0.6, timeHorizon: '3-6mo',
    tags: ['GDP', 'forecast', 'investment'],
  },
  {
    match: ['EternityX'],
    title: 'Chinese media consumption reshapes Thai consumer influence',
    summary:
      'New research highlights how audiences consuming Chinese media platforms are changing influence patterns among Thai consumers. Channel mix for reaching some segments is shifting.',
    soWhat:
      'Influence is fragmenting beyond the usual local platforms, so audience measurement built only on domestic channels will understate real reach.',
    category: 'Social', impact: 3, confidence: 0.5, timeHorizon: '3-6mo',
    tags: ['media', 'influence', 'segmentation'],
  },
]

const { articles, stats } = await collect()

const signals = []
for (const d of DEFS) {
  const sources = []
  const seen = new Set()
  for (const m of d.match) {
    const a = articles.find((x) => x.title.includes(m) && !seen.has(x.url))
    if (a) { seen.add(a.url); sources.push({ title: a.title, url: a.url, publisher: a.publisher, publishedAt: a.publishedAt || null }) }
  }
  if (!sources.length) { console.warn('! no source matched for:', d.title); continue }
  const { match, ...rest } = d
  signals.push({ id: `sample-${signals.length + 1}`, ...rest, sources })
}

const payload = {
  generatedAt: new Date().toISOString(),
  mode: 'sample',
  stats: {
    feedsScanned: stats.feedsScanned,
    feedsFailed: stats.feedsFailed,
    articlesFetched: stats.articlesFetched,
    signalsProduced: signals.length,
    model: 'sample (hand-written analyst text over real sources)',
  },
  signals,
}

const out = path.join(__dirname, '..', 'public', 'data', 'sample.json')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(payload, null, 2) + '\n', 'utf8')
console.log(`wrote sample.json with ${signals.length} signals`)
