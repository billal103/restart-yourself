import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MoodEntry } from '@/types/domain'

export function MoodChart({ entries }: { entries: MoodEntry[] }) {
  const data = entries.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    level: entry.level,
  }))

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
          <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--color-surface-muted)',
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="level"
            stroke="var(--color-primary-500)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
