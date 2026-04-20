import { useRef } from 'react'
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Note, Button } from './ui.jsx'

async function downloadChartAsPng(containerEl, filename = 'chart.png') {
  const svgs = Array.from(containerEl.querySelectorAll('svg'))
  if (!svgs.length) return

  const rects   = svgs.map(s => s.getBoundingClientRect())
  const width   = Math.max(...rects.map(r => r.width))
  const height  = rects.reduce((h, r) => h + r.height, 0)
  const dpr     = window.devicePixelRatio || 1
  const canvas  = document.createElement('canvas')
  canvas.width  = width  * dpr
  canvas.height = height * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  let offsetY = 0
  for (let i = 0; i < svgs.length; i++) {
    const svg  = svgs[i]
    const rect = rects[i]
    const clone = svg.cloneNode(true)
    clone.setAttribute('width',  rect.width)
    clone.setAttribute('height', rect.height)
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    await new Promise((resolve, reject) => {
      const img  = new Image()
      img.onload = () => { ctx.drawImage(img, 0, offsetY, rect.width, rect.height); URL.revokeObjectURL(url); resolve() }
      img.onerror = reject
      img.src = url
    })
    offsetY += rect.height
  }

  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = filename
  a.click()
}

const IOS_COLOR     = '#2563EB'
const ANDROID_COLOR = '#16A34A'
const TICK_COLOR    = '#A09488'
const GRID_COLOR    = 'rgba(0,0,0,0.06)'
const REF_COLOR     = 'rgba(0,0,0,0.12)'
const CURSOR_LINE   = 'rgba(0,0,0,0.06)'
const CURSOR_FILL   = 'rgba(0,0,0,0.03)'

function sentimentColor(score) {
  if (score >= 0.05)  return '#16A34A'
  if (score <= -0.05) return '#DC2626'
  return '#A09488'
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="chart-tooltip-box">
      <p className="chart-tooltip-period">{d.period}</p>
      {payload.map(p => {
        const sign = p.value > 0 ? '+' : ''
        return (
          <p key={p.dataKey}>
            {p.name}: <strong style={{ color: p.color }}>{sign}{p.value}</strong>
          </p>
        )
      })}
      {d.review_count   != null && <p>Reviews: <strong>{d.review_count}</strong></p>}
      {d.avg_rating     != null && <p>Avg rating: <strong>{d.avg_rating}</strong></p>}
      {d.positive_count != null && (
        <div className="sentiment-split">
          <span style={{ color: '#16A34A' }}>+{d.positive_count}</span>
          <span style={{ color: '#A09488' }}> {d.neutral_count}</span>
          <span style={{ color: '#DC2626' }}> −{d.negative_count}</span>
        </div>
      )}
    </div>
  )
}

function mergeTimeSeries(ios, android) {
  const periods = new Set([
    ...(ios     ?? []).map(d => d.period),
    ...(android ?? []).map(d => d.period),
  ])
  const iosMap     = Object.fromEntries((ios     ?? []).map(d => [d.period, d]))
  const androidMap = Object.fromEntries((android ?? []).map(d => [d.period, d]))

  return [...periods]
    .sort()
    .map(period => ({
      period,
      ios_sentiment:     iosMap[period]?.avg_sentiment  ?? null,
      android_sentiment: androidMap[period]?.avg_sentiment ?? null,
      ios_count:         iosMap[period]?.review_count   ?? 0,
      android_count:     androidMap[period]?.review_count ?? 0,
    }))
}

function Legend({ platforms }) {
  return (
    <div className="chart-legend">
      {platforms.map(({ label, color }) => (
        <div key={label} className="chart-legend-item">
          <span className="chart-legend-dot" style={{ background: color }} />
          {label}
        </div>
      ))}
    </div>
  )
}

const axisProps = {
  tick: { fontSize: 11, fill: TICK_COLOR },
  tickLine: false,
}

export function SentimentTrendChart({ ios, android, filename = 'sentiment-chart.png' }) {
  const chartRef   = useRef(null)
  const hasIos     = ios?.length     > 0
  const hasAndroid = android?.length > 0

  if (!hasIos && !hasAndroid) {
    return (
      <Note variant="muted">
        No dated reviews in range — try a wider date range or a different platform.
      </Note>
    )
  }

  const both = hasIos && hasAndroid

  if (both) {
    const merged = mergeTimeSeries(ios, android)
    return (
      <div ref={chartRef}>
        <div className="section-row">
          <Legend platforms={[
            { label: 'App Store',   color: IOS_COLOR },
            { label: 'Google Play', color: ANDROID_COLOR },
          ]} />
          <Button variant="ghost" size="sm" onClick={() => downloadChartAsPng(chartRef.current, filename)}>
            Download PNG
          </Button>
        </div>

        <div className="chart-outer">
          <p className="chart-label">Avg sentiment over time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={merged} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} {...axisProps} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: CURSOR_LINE }} />
              <ReferenceLine y={0} stroke={REF_COLOR} strokeDasharray="4 4" />
              <Line
                type="monotone" dataKey="ios_sentiment" name="App Store"
                stroke={IOS_COLOR} strokeWidth={2.5} connectNulls
                dot={{ fill: IOS_COLOR, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: IOS_COLOR, strokeWidth: 0 }}
              />
              <Line
                type="monotone" dataKey="android_sentiment" name="Google Play"
                stroke={ANDROID_COLOR} strokeWidth={2.5} connectNulls
                dot={{ fill: ANDROID_COLOR, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: ANDROID_COLOR, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-outer">
          <p className="chart-label">Review volume</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={merged} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} axisLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: CURSOR_FILL }} />
              <Bar dataKey="ios_count"     name="App Store"   fill={IOS_COLOR}     fillOpacity={0.55} radius={[3, 3, 0, 0]} />
              <Bar dataKey="android_count" name="Google Play" fill={ANDROID_COLOR} fillOpacity={0.55} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // Single platform
  const data  = hasIos ? ios : android
  const color = hasIos ? IOS_COLOR : ANDROID_COLOR

  return (
    <div ref={chartRef}>
      <div className="section-row">
        <span />
        <Button variant="ghost" size="sm" onClick={() => downloadChartAsPng(chartRef.current, filename)}>
          Download PNG
        </Button>
      </div>
      <div className="chart-outer">
        <p className="chart-label">Avg sentiment over time</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="period" {...axisProps} />
            <YAxis domain={[-1, 1]} ticks={[-1, -0.5, 0, 0.5, 1]} {...axisProps} axisLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: CURSOR_LINE }} />
            <ReferenceLine y={0} stroke={REF_COLOR} strokeDasharray="4 4" />
            <Line
              type="monotone" dataKey="avg_sentiment" name="Sentiment"
              stroke={color} strokeWidth={2.5}
              dot={{ fill: color, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: color, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-outer">
        <p className="chart-label">Review volume</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="period" {...axisProps} />
            <YAxis {...axisProps} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: CURSOR_FILL }} />
            <Bar dataKey="review_count" name="Reviews" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={sentimentColor(entry.avg_sentiment)} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
