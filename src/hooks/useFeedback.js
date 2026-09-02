import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'signal-radar-feedback'

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** Per-viewer relevance feedback: { [signalId]: 1 | -1 }. Local only. */
export function useFeedback() {
  const [feedback, setFeedback] = useState(read)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(feedback))
    } catch {
      /* non-fatal */
    }
  }, [feedback])

  const vote = useCallback((id, value) => {
    setFeedback((prev) => {
      const next = { ...prev }
      if (next[id] === value) delete next[id] // clicking again clears the vote
      else next[id] = value
      return next
    })
  }, [])

  const reset = useCallback(() => setFeedback({}), [])

  return { feedback, vote, reset }
}
