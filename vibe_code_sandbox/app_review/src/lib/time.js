export function toDateInputValue(date) {
  return date.toISOString().slice(0, 10)
}

export function getDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 90)

  return {
    start: toDateInputValue(start),
    end: toDateInputValue(end),
  }
}

export function withinRange(value, start, end) {
  const day = new Date(`${value}T00:00:00`)
  const startDay = new Date(`${start}T00:00:00`)
  const endDay = new Date(`${end}T23:59:59`)

  return day >= startDay && day <= endDay
}
