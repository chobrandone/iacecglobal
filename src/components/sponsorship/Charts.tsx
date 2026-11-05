import type { ReactNode } from 'react';
import { Card } from '@/components/admin/ui';

export type Point = { label: string; value: number };
export type GroupPoint = { label: string; first: number; second: number };

// Checked with the palette validator: both pass lightness, colour-blind separation and contrast on white.
const BLUE = 'bg-[#1F5FAE]';
const GOLD = 'bg-gold-deep';

function ChartCard({ title, children, table }: { title: string; children: ReactNode; table: ReactNode }) {
  return (
    <Card>
      <h2 className="text-sm text-navy">{title}</h2>
      <div className="mt-4">{children}</div>
      <details className="mt-3 text-xs text-ink/55">
        <summary className="cursor-pointer">Show as a table</summary>
        <table className="mt-2 w-full text-left">{table}</table>
      </details>
    </Card>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[0.7rem] text-white group-hover:block">
      {children}
    </span>
  );
}

/** One measure over time: thin columns on a shared baseline. */
export function ColumnChart({ title, data }: { title: string; data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ChartCard
      title={title}
      table={
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th className="py-0.5 font-normal">{d.label}</th>
              <td className="text-right">{d.value}</td>
            </tr>
          ))}
        </tbody>
      }
    >
      <div className="flex h-36 items-end gap-0.5 border-b border-navy/15" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 items-end justify-center">
            <Tip>
              {d.label}: {d.value}
            </Tip>
            <div className={`w-full max-w-5 rounded-t ${BLUE}`} style={{ height: d.value ? `${Math.max(3, (d.value / max) * 100)}%` : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.68rem] text-ink/50">
        <span>{data[0]?.label}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </ChartCard>
  );
}

/** Comparing categories: horizontal bars with the value beside each. */
export function BarList({ title, data }: { title: string; data: Point[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ChartCard
      title={title}
      table={
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th className="py-0.5 font-normal">{d.label}</th>
              <td className="text-right">{d.value}</td>
            </tr>
          ))}
        </tbody>
      }
    >
      <ul className="space-y-1.5" aria-label={title}>
        {data.map((d) => (
          <li key={d.label} className="grid grid-cols-[8.5rem_1fr_1.5rem] items-center gap-2 text-xs">
            <span className="truncate text-ink/70">{d.label}</span>
            <span className="h-2.5">
              <span className={`block h-full rounded-r ${BLUE}`} style={{ width: d.value ? `${Math.max(2, (d.value / max) * 100)}%` : 0 }} />
            </span>
            <span className="text-right font-semibold text-ink/75">{d.value}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

/** Two series per category, with a legend so identity never depends on colour alone. */
export function GroupedBars({ title, firstLabel, secondLabel, data }: { title: string; firstLabel: string; secondLabel: string; data: GroupPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.first, d.second]));
  const bar = (value: number, tone: string) => <span className={`block h-2.5 rounded-r ${tone}`} style={{ width: value ? `${Math.max(2, (value / max) * 100)}%` : 0 }} />;
  return (
    <ChartCard
      title={title}
      table={
        <>
          <thead>
            <tr>
              <th className="font-normal">Age</th>
              <th className="text-right font-normal">{firstLabel}</th>
              <th className="text-right font-normal">{secondLabel}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th className="py-0.5 font-normal">{d.label}</th>
                <td className="text-right">{d.first}</td>
                <td className="text-right">{d.second}</td>
              </tr>
            ))}
          </tbody>
        </>
      }
    >
      <div className="mb-3 flex gap-4 text-xs text-ink/70">
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${BLUE}`} /> {firstLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-sm ${GOLD}`} /> {secondLabel}
        </span>
      </div>
      <ul className="space-y-2.5" aria-label={title}>
        {data.map((d) => (
          <li key={d.label} className="grid grid-cols-[3.5rem_1fr] items-center gap-2 text-xs">
            <span className="text-ink/70">{d.label}</span>
            <span className="group relative block space-y-0.5">
              <Tip>
                {firstLabel} {d.first}, {secondLabel} {d.second}
              </Tip>
              {bar(d.first, BLUE)}
              {bar(d.second, GOLD)}
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
