function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenize(value) {
  return normalize(value).split(' ').filter(Boolean)
}

function scoreText(query, text, weight = 1) {
  const q = normalize(query)
  const t = normalize(text)

  if (!q || !t) return 0
  if (t === q) return 100 * weight

  let score = 0

  if (t.includes(q)) score += 60

  const qTokens = tokenize(q)
  const tTokens = tokenize(t)
  const tSet = new Set(tTokens)

  let overlap = 0
  for (const token of qTokens) {
    if (tSet.has(token)) {
      overlap += 1
      continue
    }

    if (tTokens.some((candidate) => candidate.startsWith(token) || token.startsWith(candidate))) {
      overlap += 0.6
    }
  }

  score += (overlap / Math.max(qTokens.length, 1)) * 30

  for (const token of qTokens) {
    if (t.startsWith(token)) score += 2
  }

  return score * weight
}

export function rankApps(query, apps) {
  return [...apps]
    .map((app) => {
      const searchHaystack = [
        app.name,
        app.publisher,
        app.category,
        app.description,
        ...(app.aliases ?? []),
      ]

      const score = searchHaystack.reduce((total, value, index) => {
        const weight = index === 0 ? 2.4 : index === 1 ? 1.3 : index === 2 ? 1 : 0.8
        return total + scoreText(query, value, weight)
      }, 0)

      return { ...app, score }
    })
    .filter((app) => app.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
}
