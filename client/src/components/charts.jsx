import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card } from './ui';
import { APP_STATUS, OPP_TYPES } from '../utils/format';

export const PALETTE = ['#4479f5', '#7c5cf0', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#94a3b8'];
const STATUS_COLOR = { APPLIED: '#4479f5', UNDER_REVIEW: '#f59e0b', SHORTLISTED: '#7c5cf0', INTERVIEW: '#06b6d4', SELECTED: '#10b981', REJECTED: '#f43f5e' };

const axis = { fontSize: 12, fill: '#64748b' };
const tooltipStyle = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgb(15 23 42 / 0.08)', fontSize: 12 };

export function ChartCard({ title, subtitle, children, empty, height = 260, className }) {
  return (
    <Card className={`p-5 ${className ?? ''}`}>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-4" style={{ height }}>
        {empty
          ? <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400"><BarChart3 className="size-6" />No data yet</div>
          : <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>}
      </div>
    </Card>
  );
}

export function HBarChart({ data, dataKey = 'value', nameKey = 'name', color = PALETTE[0], height, title, subtitle }) {
  return (
    <ChartCard title={title} subtitle={subtitle} empty={!data?.length} height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="#eef2f7" />
        <XAxis type="number" tick={axis} allowDecimals={false} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey={nameKey} tick={axis} width={100} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 8, 8, 0]} barSize={16} />
      </BarChart>
    </ChartCard>
  );
}

export function VBarChart({ data, bars, nameKey = 'name', title, subtitle, height, colors = PALETTE }) {
  return (
    <ChartCard title={title} subtitle={subtitle} empty={!data?.length} height={height}>
      <BarChart data={data} margin={{ left: -16, right: 8 }}>
        <CartesianGrid vertical={false} stroke="#eef2f7" />
        <XAxis dataKey={nameKey} tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
        {bars.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {bars.map((b, i) => <Bar key={b.key} dataKey={b.key} name={b.label} fill={colors[i]} radius={[6, 6, 0, 0]} maxBarSize={36} />)}
      </BarChart>
    </ChartCard>
  );
}

export function DonutChart({ data, title, subtitle, labelMap, colorMap, height }) {
  const rows = (data || []).filter((d) => d.value > 0).map((d) => ({ ...d, label: labelMap?.[d.name ?? d.status ?? d.type] ?? d.name ?? d.status ?? d.type, key: d.name ?? d.status ?? d.type }));
  return (
    <ChartCard title={title} subtitle={subtitle} empty={!rows.length} height={height}>
      <PieChart>
        <Pie data={rows} dataKey="value" nameKey="label" innerRadius="55%" outerRadius="82%" paddingAngle={3} stroke="none">
          {rows.map((r, i) => <Cell key={r.key} fill={colorMap?.[r.key] ?? PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ChartCard>
  );
}

export function TrendChart({ data, series, title, subtitle, height }) {
  return (
    <ChartCard title={title} subtitle={subtitle} empty={!data?.length || data.every((d) => series.every((s) => !d[s.key]))} height={height}>
      <AreaChart data={data} margin={{ left: -16, right: 8 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PALETTE[i]} stopOpacity={0.35} /><stop offset="100%" stopColor={PALETTE[i]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="#eef2f7" />
        <XAxis dataKey="month" tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} allowDecimals={false} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={PALETTE[i]} strokeWidth={2.5} fill={`url(#g-${s.key})`} />)}
      </AreaChart>
    </ChartCard>
  );
}

export const statusDonut = (data, title, subtitle) => <DonutChart data={data} title={title} subtitle={subtitle} labelMap={APP_STATUS} colorMap={STATUS_COLOR} />;
export const typeDonut = (data, title, subtitle) => <DonutChart data={data} title={title} subtitle={subtitle} labelMap={OPP_TYPES} />;
