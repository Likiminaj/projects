import { Router } from 'express'
import { notion } from '../../notion.js'

const router = Router()
const HABITS_DB = () => process.env.NOTION_HABITS_DB
const LOGS_DB   = () => process.env.NOTION_HABIT_LOGS_DB

async function queryAll(dbId, filter, sorts) {
  if (!dbId) return []
  const results = []
  let cursor
  do {
    const params = { database_id: dbId, page_size: 100 }
    if (filter) params.filter = filter
    if (sorts)  params.sorts  = sorts
    if (cursor) params.start_cursor = cursor
    const res = await notion.databases.query(params)
    results.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return results
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Return all scheduled dates for a habit within [from, to]
function getScheduledDates(habit, from, to) {
  const dates = []
  const rangeStart = new Date(Math.max(
    new Date(habit.startDate || from),
    new Date(from),
  ))
  const rangeEnd = new Date(Math.min(
    habit.endDate ? new Date(habit.endDate) : new Date(to),
    new Date(to),
  ))
  if (rangeStart > rangeEnd) return dates

  if (habit.cadence === 'Weekly') {
    // One slot per week — represent as Monday of each week in range
    const cur = new Date(rangeStart)
    const seenWeeks = new Set()
    while (cur <= rangeEnd) {
      const mon = new Date(cur)
      const dow = cur.getDay()
      mon.setDate(cur.getDate() - dow + (dow === 0 ? -6 : 1))
      const weekKey = mon.toISOString().slice(0, 10)
      if (!seenWeeks.has(weekKey)) {
        seenWeeks.add(weekKey)
        dates.push(weekKey)
      }
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }

  const cur = new Date(rangeStart)
  while (cur <= rangeEnd) {
    const dateStr = cur.toISOString().slice(0, 10)
    const dow     = cur.getDay()
    if (habit.cadence === 'Daily') {
      dates.push(dateStr)
    } else if (habit.cadence === 'Custom') {
      if ((habit.cadenceDays ?? []).includes(DAY_NAMES[dow])) dates.push(dateStr)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

function computeCurrentStreak(scheduledDates, logMap) {
  const sorted = [...scheduledDates].sort().reverse()
  let streak = 0
  for (const date of sorted) {
    const log = logMap.get(date)
    if (log?.status === 'Completed') { streak++; continue }
    if (log?.status === 'Skipped')   continue  // doesn't break streak
    break
  }
  return streak
}

function computeLongestStreak(scheduledDates, logMap) {
  const sorted = [...scheduledDates].sort()
  let longest = 0, cur = 0
  for (const date of sorted) {
    const log = logMap.get(date)
    if (log?.status === 'Completed')     { cur++; longest = Math.max(longest, cur) }
    else if (log?.status === 'Skipped')  continue
    else                                  cur = 0
  }
  return longest
}

// GET /api/habits/review?period=week|month&date=YYYY-MM-DD
router.get('/review', async (req, res) => {
  if (!HABITS_DB() || !LOGS_DB()) return res.json({ success: true, data: null })
  try {
    const { period = 'month', date } = req.query
    const refDate = date ? new Date(date) : new Date()

    // Current period bounds
    let from, to
    if (period === 'week') {
      const dow = refDate.getDay()
      const mon = new Date(refDate); mon.setDate(refDate.getDate() - dow + (dow === 0 ? -6 : 1))
      const sun = new Date(mon);     sun.setDate(mon.getDate() + 6)
      from = mon.toISOString().slice(0, 10)
      to   = sun.toISOString().slice(0, 10)
    } else {
      from = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-01`
      to   = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).toISOString().slice(0, 10)
    }

    // Previous period bounds (for trend)
    let prevFrom, prevTo
    if (period === 'week') {
      const d1 = new Date(from); d1.setDate(d1.getDate() - 7)
      const d2 = new Date(to);   d2.setDate(d2.getDate() - 7)
      prevFrom = d1.toISOString().slice(0, 10)
      prevTo   = d2.toISOString().slice(0, 10)
    } else {
      const d1 = new Date(from); d1.setMonth(d1.getMonth() - 1)
      prevFrom = d1.toISOString().slice(0, 10)
      prevTo   = new Date(d1.getFullYear(), d1.getMonth() + 1, 0).toISOString().slice(0, 10)
    }

    // Fetch data
    const habitPages = await queryAll(
      HABITS_DB(),
      { property: 'Status', select: { equals: 'Active' } },
      [{ property: 'Name', direction: 'ascending' }],
    )
    const logPages = await queryAll(LOGS_DB(), {
      and: [
        { property: 'Date', date: { on_or_after:  prevFrom } },
        { property: 'Date', date: { on_or_before: to } },
      ],
    })

    const habits = habitPages.map(pg => {
      const p = pg.properties
      return {
        id:          pg.id,
        name:        p.Name?.title?.[0]?.plain_text ?? '',
        category:    p.Category?.select?.name ?? null,
        type:        p.Type?.select?.name ?? 'Binary',
        cadence:     p.Cadence?.select?.name ?? 'Daily',
        cadenceDays: p['Cadence Days']?.multi_select?.map(o => o.name) ?? [],
        startDate:   p['Start Date']?.date?.start ?? null,
        endDate:     p['End Date']?.date?.start ?? null,
        importance:  p.Importance?.number ?? 3,
      }
    })

    const allLogs = logPages.map(pg => {
      const p = pg.properties
      return {
        habitId: p.Habit?.relation?.[0]?.id ?? null,
        date:    p.Date?.date?.start ?? null,
        status:  p.Status?.select?.name ?? 'Completed',
        value:   p.Value?.number ?? null,
      }
    })

    // Build per-habit stats
    const today = new Date().toISOString().slice(0, 10)

    const habitStats = habits.map(h => {
      const makeLogMap = (fromD, toD) => {
        const m = new Map()
        for (const l of allLogs) {
          if (l.habitId === h.id && l.date >= fromD && l.date <= toD) m.set(l.date, l)
        }
        return m
      }

      const scheduled     = getScheduledDates(h, from, to)
      const prevScheduled = getScheduledDates(h, prevFrom, prevTo)
      const logMap        = makeLogMap(from, to)
      const prevLogMap    = makeLogMap(prevFrom, prevTo)

      const completed = scheduled.filter(d => logMap.get(d)?.status === 'Completed').length
      const skipped   = scheduled.filter(d => logMap.get(d)?.status === 'Skipped').length
      const missed    = scheduled.length - completed - skipped
      const completionRate = scheduled.length > 0
        ? Math.round((completed / scheduled.length) * 100) : 0

      const prevCompleted = prevScheduled.filter(d => prevLogMap.get(d)?.status === 'Completed').length
      const prevRate = prevScheduled.length > 0
        ? Math.round((prevCompleted / prevScheduled.length) * 100) : 0

      // Streaks — use all history up to today
      const allScheduled = getScheduledDates(h, h.startDate || from, today)
      const allLogMap    = makeLogMap(h.startDate || from, today)
      const currentStreak = computeCurrentStreak(allScheduled, allLogMap)
      const longestStreak = computeLongestStreak(allScheduled, allLogMap)

      // Day-of-week pattern (Daily / Custom only)
      const dowStats = DAY_NAMES.map(day => {
        const dayDates = scheduled.filter(d => DAY_NAMES[new Date(d).getDay()] === day)
        const done = dayDates.filter(d => logMap.get(d)?.status === 'Completed').length
        return { day, total: dayDates.length, completed: done }
      }).filter(s => s.total > 0)

      // Consistency score: std-dev of weekly completion rates within period
      let consistencyScore = 100
      if (period === 'month' && scheduled.length > 0) {
        const weekRates = []
        const refD = new Date(from)
        while (refD <= new Date(to)) {
          const wStart = new Date(refD); wStart.setDate(refD.getDate() - refD.getDay() + (refD.getDay() === 0 ? -6 : 1))
          const wEnd   = new Date(wStart); wEnd.setDate(wStart.getDate() + 6)
          const wFrom  = wStart.toISOString().slice(0, 10)
          const wTo    = wEnd.toISOString().slice(0, 10)
          const wSched = scheduled.filter(d => d >= wFrom && d <= wTo)
          if (wSched.length > 0) {
            const wDone = wSched.filter(d => logMap.get(d)?.status === 'Completed').length
            weekRates.push(wDone / wSched.length)
          }
          refD.setDate(refD.getDate() + 7)
        }
        if (weekRates.length > 1) {
          const mean = weekRates.reduce((s, v) => s + v, 0) / weekRates.length
          const variance = weekRates.reduce((s, v) => s + (v - mean) ** 2, 0) / weekRates.length
          consistencyScore = Math.round(Math.max(0, 100 - Math.sqrt(variance) * 200))
        }
      }

      return {
        habitId: h.id, name: h.name, category: h.category,
        type: h.type, cadence: h.cadence, importance: h.importance,
        scheduled: scheduled.length, completed, missed, skipped,
        completionRate, prevCompletionRate: prevRate,
        trend: completionRate - prevRate,
        currentStreak, longestStreak, consistencyScore,
        dowStats,
      }
    })

    const withData = habitStats.filter(h => h.scheduled > 0)

    // Global metrics
    const overallCompleted  = habitStats.reduce((s, h) => s + h.completed,  0)
    const overallScheduled  = habitStats.reduce((s, h) => s + h.scheduled, 0)
    const overallRate       = overallScheduled > 0
      ? Math.round((overallCompleted / overallScheduled) * 100) : 0

    // Insights
    const mostConsistent = [...withData]
      .sort((a, b) => b.completionRate - a.completionRate || b.currentStreak - a.currentStreak)
      .slice(0, 3)
      .map(h => ({ habitId: h.habitId, name: h.name, completionRate: h.completionRate, currentStreak: h.currentStreak }))

    const needsAttention = [...withData]
      .filter(h => h.completionRate < 60)
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 3)
      .map(h => ({ habitId: h.habitId, name: h.name, completionRate: h.completionRate, trend: h.trend }))

    const improving = [...withData]
      .filter(h => h.trend >= 10)
      .sort((a, b) => b.trend - a.trend)
      .slice(0, 3)
      .map(h => ({ habitId: h.habitId, name: h.name, trend: h.trend }))

    const declining = [...withData]
      .filter(h => h.trend <= -10)
      .sort((a, b) => a.trend - b.trend)
      .slice(0, 3)
      .map(h => ({ habitId: h.habitId, name: h.name, trend: h.trend }))

    const weekendWeak = withData
      .filter(h => {
        const we = h.dowStats.filter(d => d.day === 'Sat' || d.day === 'Sun')
        const wd = h.dowStats.filter(d => d.day !== 'Sat' && d.day !== 'Sun')
        const weRate = we.reduce((s, d) => s + d.completed, 0) / Math.max(we.reduce((s, d) => s + d.total, 0), 1)
        const wdRate = wd.reduce((s, d) => s + d.completed, 0) / Math.max(wd.reduce((s, d) => s + d.total, 0), 1)
        return wd.length > 0 && we.length > 0 && wdRate > 0 && weRate < wdRate * 0.65
      })
      .map(h => h.name)

    // Suggested actions
    const suggestions = withData.flatMap(h => {
      const acts = []
      if (h.completionRate < 40 && h.cadence === 'Daily')
        acts.push({ habitId: h.habitId, name: h.name, action: 'reduce_cadence', reason: `Only ${h.completionRate}% completion — try 3x/week instead` })
      if (h.completionRate === 0 && h.scheduled >= 3)
        acts.push({ habitId: h.habitId, name: h.name, action: 'consider_removing', reason: `Not logged once this period` })
      if (h.completionRate >= 95 && h.type === 'Binary')
        acts.push({ habitId: h.habitId, name: h.name, action: 'increase_difficulty', reason: `Perfect execution — ready to level up` })
      return acts
    })

    res.json({
      success: true,
      data: {
        period, from, to,
        overall: { completed: overallCompleted, scheduled: overallScheduled, rate: overallRate },
        habits: habitStats,
        insights: { mostConsistent, needsAttention, improving, declining, weekendWeak },
        suggestions,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
