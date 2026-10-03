import { createContext, useContext } from 'react'

// UI strings. Signal content (title / summary / soWhat) is generated in both
// languages by the pipeline — see pickText() below.
export const STRINGS = {
  en: {
    eyebrow: 'Thailand Trend Intelligence',
    tagline:
      'An automated pipeline scans Thai news feeds every 6 hours, then an LLM clusters them into strategic signals across economic, business, industry, consumer and social trends — each with a “so what” for a strategy team.',
    updated: 'Updated',
    model: 'Model',
    feedsUnavailable: 'feed(s) unavailable this run',
    sampleTitle: 'Sample data.',
    sampleBody:
      'Sources are real articles pulled by the live collector, but the analysis text is placeholder. Add a GEMINI_API_KEY and run the pipeline to generate real AI signals.',
    loadError: 'Could not load signal data:',

    statSignals: 'Signals surfaced',
    statArticles: 'articles scanned',
    statTopCategory: 'Top category',
    statSignalsCount: 'signals',
    statAvgImpact: 'Avg. impact',
    statWeighted: 'weighted by confidence',
    statSources: 'Sources',
    statFeeds: 'feeds monitored',

    chartByCategory: 'Signals by category',
    chartImpact: 'Impact distribution',
    chartImpactAxis: 'impact score (1–5)',

    searchPlaceholder: 'Search signals, tags or sources…',
    horizon: 'Horizon',
    all: 'All',
    minImpact: 'Min impact',
    showing: 'Showing',
    of: 'of',
    signalsLower: 'signals',
    reset: 'Reset',

    confidence: 'confidence',
    soWhat: 'So what:',
    source: 'source',
    sources: 'sources',
    relevant: 'Relevant?',
    markRelevant: 'Mark as relevant',
    markNotRelevant: 'Mark as not relevant',
    personalised: 'Ranking personalised from',
    rating: 'rating',
    ratings: 'ratings',
    youGave: 'you gave.',
    clear: 'Clear',

    emptyTitle: 'No signals match these filters',
    emptyBody: 'Try lowering the minimum impact or clearing the search.',

    footerLeft: 'Signal Radar — automated trend intelligence. Built by Natthaphon Phukaew.',
    footerRight: 'Data collected from public RSS feeds · analysis by Gemini',

    langLabel: 'EN',
    switchLang: 'เปลี่ยนเป็นภาษาไทย',
  },

  th: {
    eyebrow: 'สัญญาณแนวโน้มประเทศไทย',
    tagline:
      'ระบบอัตโนมัติจะกวาดข่าวจากสำนักข่าวไทยทุก 6 ชั่วโมง แล้วให้ AI จับกลุ่มข่าวเป็น “สัญญาณเชิงกลยุทธ์” ครอบคลุมด้านเศรษฐกิจ ธุรกิจ อุตสาหกรรม ผู้บริโภค และสังคม พร้อมบอกว่า “แล้วยังไงต่อ” สำหรับทีมกลยุทธ์',
    updated: 'อัปเดตเมื่อ',
    model: 'โมเดล',
    feedsUnavailable: 'แหล่งข่าวใช้งานไม่ได้ในรอบนี้',
    sampleTitle: 'ข้อมูลตัวอย่าง',
    sampleBody:
      'แหล่งข่าวเป็นบทความจริงที่ระบบดึงมา แต่ข้อความวิเคราะห์ยังเป็นตัวอย่าง ใส่ GEMINI_API_KEY แล้วรัน pipeline เพื่อให้ AI วิเคราะห์จริง',
    loadError: 'โหลดข้อมูลสัญญาณไม่สำเร็จ:',

    statSignals: 'สัญญาณที่พบ',
    statArticles: 'บทความที่สแกน',
    statTopCategory: 'หมวดเด่นสุด',
    statSignalsCount: 'สัญญาณ',
    statAvgImpact: 'ผลกระทบเฉลี่ย',
    statWeighted: 'ถ่วงน้ำหนักด้วยความมั่นใจ',
    statSources: 'แหล่งข่าว',
    statFeeds: 'ฟีดที่ติดตาม',

    chartByCategory: 'สัญญาณแยกตามหมวด',
    chartImpact: 'การกระจายของผลกระทบ',
    chartImpactAxis: 'คะแนนผลกระทบ (1–5)',

    searchPlaceholder: 'ค้นหาสัญญาณ แท็ก หรือแหล่งข่าว…',
    horizon: 'ช่วงเวลา',
    all: 'ทั้งหมด',
    minImpact: 'ผลกระทบขั้นต่ำ',
    showing: 'แสดง',
    of: 'จาก',
    signalsLower: 'สัญญาณ',
    reset: 'ล้างตัวกรอง',

    confidence: 'ความมั่นใจ',
    soWhat: 'แล้วยังไงต่อ:',
    source: 'แหล่งข่าว',
    sources: 'แหล่งข่าว',
    relevant: 'ตรงใจไหม?',
    markRelevant: 'ทำเครื่องหมายว่าเกี่ยวข้อง',
    markNotRelevant: 'ทำเครื่องหมายว่าไม่เกี่ยวข้อง',
    personalised: 'จัดอันดับใหม่จาก',
    rating: 'คะแนน',
    ratings: 'คะแนน',
    youGave: 'ที่คุณให้ไว้',
    clear: 'ล้าง',

    emptyTitle: 'ไม่มีสัญญาณที่ตรงกับตัวกรองนี้',
    emptyBody: 'ลองลดผลกระทบขั้นต่ำ หรือล้างคำค้นหา',

    footerLeft: 'Signal Radar — ระบบติดตามแนวโน้มอัตโนมัติ พัฒนาโดย ณัฐพล ภู่แก้ว',
    footerRight: 'ข้อมูลจาก RSS สาธารณะ · วิเคราะห์โดย Gemini',

    langLabel: 'ไทย',
    switchLang: 'Switch to English',
  },
}

export const CATEGORY_LABELS = {
  en: {},
  th: {
    Economic: 'เศรษฐกิจ',
    Business: 'ธุรกิจ',
    Industry: 'อุตสาหกรรม',
    Consumer: 'ผู้บริโภค',
    Social: 'สังคม',
    Technology: 'เทคโนโลยี',
  },
}

export const HORIZON_LABELS = {
  en: {},
  th: { Now: 'ตอนนี้', '3-6mo': '3-6 เดือน', '1yr+': '1 ปีขึ้นไป' },
}

export const LangContext = createContext({ lang: 'en', t: (k) => k, toggle: () => {} })
export const useLang = () => useContext(LangContext)

/** Translate a fixed enum value for display only — filtering still uses the English key. */
export const catLabel = (lang, c) => CATEGORY_LABELS[lang]?.[c] || c
export const horizonLabel = (lang, h) => HORIZON_LABELS[lang]?.[h] || h

/**
 * Pick a signal field in the active language, falling back to English.
 * The pipeline writes titleTh / summaryTh / soWhatTh; older data has only English.
 */
export function pickText(signal, field, lang) {
  if (lang === 'th') {
    const thai = signal[field + 'Th']
    if (thai && String(thai).trim()) return thai
  }
  return signal[field]
}
