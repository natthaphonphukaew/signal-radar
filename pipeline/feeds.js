// RSS sources — all free, no API key required.
// Google News RSS lets us run targeted queries; direct feeds add depth.

const googleNews = (query, lang = 'th', country = 'TH') =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${lang}&gl=${country}&ceid=${country}:${lang}`

export const FEEDS = [
  // --- Economic ---
  { name: 'Thailand economy', category: 'Economic', url: googleNews('เศรษฐกิจไทย when:7d') },
  { name: 'Thai baht & investment', category: 'Economic', url: googleNews('ลงทุน เศรษฐกิจ ไทย when:7d') },

  // --- Business / Industry ---
  { name: 'Thailand digital economy', category: 'Business', url: googleNews('เศรษฐกิจดิจิทัล ไทย when:7d') },
  { name: 'Thailand startup funding', category: 'Business', url: googleNews('สตาร์ทอัพ ไทย ระดมทุน when:7d') },
  { name: 'Thailand e-commerce', category: 'Industry', url: googleNews('อีคอมเมิร์ซ ไทย when:7d') },

  // --- Consumer / Social ---
  { name: 'Thai consumer behaviour', category: 'Consumer', url: googleNews('พฤติกรรมผู้บริโภค ไทย when:7d') },

  // --- Technology ---
  { name: 'AI adoption Thailand', category: 'Technology', url: googleNews('AI ธุรกิจ ไทย when:7d') },
  { name: 'Thailand tech (EN)', category: 'Technology', url: googleNews('Thailand technology business', 'en', 'TH') },

  // --- Direct publisher feeds ---
  { name: 'Blognone', category: 'Technology', url: 'https://www.blognone.com/atom.xml' },
  { name: 'Techsauce', category: 'Business', url: 'https://techsauce.co/feed' },
]

// Keep the LLM prompt inside free-tier limits.
export const LIMITS = {
  perFeed: 12,      // max articles taken from each feed
  totalArticles: 70, // hard cap sent to the model
  maxSignals: 14,    // signals requested per run
}
