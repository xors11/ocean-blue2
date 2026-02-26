import React, { useMemo, memo } from 'react';
import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { PARAMETERS } from '../data/constants';
import { computeStats, isAnomaly, zScore, classifyAnomaly, computeMovingAverage } from '../utils/anomaly';

// ─── Static style objects (module scope – never recreated per render) ─────────
const CHART_MARGIN = { top: 10, right: 16, left: 0, bottom: 0 };
const GRID_STYLE = { strokeDasharray: '3 3', stroke: 'rgba(36,144,204,0.1)', vertical: false };
const XAXIS_TICK = { fill: '#4db8e8', fontSize: 9 };
const XAXIS_LINE = { stroke: 'rgba(36,144,204,0.2)' };
const YAXIS_TICK = { fill: '#4db8e8', fontSize: 10 };
const Y_DOMAIN = ['auto', 'auto'];

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div
            style={{
                background: 'rgba(4,24,46,0.95)',
                border: '1px solid rgba(0,212,255,0.35)',
                borderRadius: '0.6rem',
                padding: '0.6rem 0.85rem',
                fontSize: '0.78rem',
                backdropFilter: 'blur(12px)',
                minWidth: 200,
            }}
        >
            <div style={{ color: '#4db8e8', fontWeight: 700, marginBottom: 4, fontSize: '0.7rem' }}>
                {label}
            </div>
            {payload.map((entry) => (
                <div
                    key={entry.dataKey}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: entry.color }}
                >
                    <span>{entry.name}</span>
                    <span style={{ fontWeight: 700 }}>
                        {entry.value !== null && entry.value !== undefined
                            ? Number(entry.value).toFixed(2)
                            : '—'}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Custom Dot: render anomaly circles with Z-score colour classification ────
function AnomalyDot(props) {
    const { cx, cy, payload, dataKey, fieldMean, fieldStd } = props;
    if (!payload || payload[dataKey] == null) return null;
    if (!isAnomaly(payload[dataKey], fieldMean, fieldStd)) return null;

    const z = zScore(payload[dataKey], fieldMean, fieldStd);
    const cls = classifyAnomaly(z);

    const color = cls === 'extreme' ? '#ef4444' : '#fb923c'; // extreme → red, moderate → orange
    return (
        <g>
            <circle cx={cx} cy={cy} r={7} fill="none" stroke={color} strokeWidth={2} opacity={0.8} />
            <circle cx={cx} cy={cy} r={3.5} fill={color} opacity={0.9} />
        </g>
    );
}

// ─── Anomaly badge for chart header ──────────────────────────────────────────
function AnomalyBadge({ s }) {
    if (!s || s.anomalyCount === 0) return null;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,77,109,0.12)',
                border: '1px solid rgba(255,77,109,0.3)',
                borderRadius: 99, padding: '0.2rem 0.6rem',
                fontSize: '0.7rem', color: '#ff4d6d',
            }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4d6d', display: 'inline-block' }} />
                {s.anomalyCount} anomal{s.anomalyCount === 1 ? 'y' : 'ies'}
            </div>
            {s.moderateCount > 0 && (
                <div style={{
                    background: 'rgba(251,146,60,0.10)', border: '1px solid rgba(251,146,60,0.28)',
                    borderRadius: 99, padding: '0.2rem 0.55rem',
                    fontSize: '0.68rem', color: '#fb923c', fontWeight: 700,
                }}>
                    {s.moderateCount} mod
                </div>
            )}
            {s.extremeCount > 0 && (
                <div style={{
                    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
                    borderRadius: 99, padding: '0.2rem 0.55rem',
                    fontSize: '0.68rem', color: '#ef4444', fontWeight: 700,
                }}>
                    {s.extremeCount} extreme
                </div>
            )}
        </div>
    );
}

// ─── Per-parameter sub-chart — memoized so it only re-renders when props change ─
const ParamChart = memo(function ParamChart({ param, chartData, stats, showMovingAverage }) {
    const s = stats[param.key];

    // Stable activeDot config per param — avoids object recreation
    const activeDot = useMemo(
        () => ({ r: 5, fill: param.color, stroke: '#fff', strokeWidth: 1 }),
        [param.color]
    );

    // MA key name so it doesn't conflict with the raw data key
    const maKey = `${param.key}_ma`;

    return (
        <div className="glass-card p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: param.color }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: param.color }}>
                        {param.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#4db8e8', opacity: 0.7 }}>({param.unit})</span>
                </div>
                <AnomalyBadge s={s} />
            </div>

            <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={chartData} margin={CHART_MARGIN}>
                    <CartesianGrid {...GRID_STYLE} />
                    <XAxis
                        dataKey="label"
                        tick={XAXIS_TICK}
                        axisLine={XAXIS_LINE}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={Y_DOMAIN}
                        tick={YAXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        width={50}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    {/* Mean reference */}
                    {s?.mean != null && (
                        <ReferenceLine
                            y={s.mean}
                            stroke="rgba(0,212,255,0.45)"
                            strokeDasharray="5 3"
                            label={{ value: `μ ${Number(s.mean).toFixed(1)}`, position: 'insideTopRight', fill: 'rgba(0,212,255,0.65)', fontSize: 10 }}
                        />
                    )}
                    {/* Anomaly threshold μ+2σ */}
                    {s?.anomalyThreshold != null && (
                        <ReferenceLine
                            y={s.anomalyThreshold}
                            stroke="rgba(255,77,109,0.5)"
                            strokeDasharray="4 4"
                            label={{ value: 'μ+2σ', position: 'insideTopRight', fill: 'rgba(255,77,109,0.75)', fontSize: 10 }}
                        />
                    )}

                    {/* Main data line */}
                    <Line
                        type="monotone"
                        dataKey={param.key}
                        name={param.label}
                        stroke={param.color}
                        strokeWidth={2}
                        dot={(dotProps) => (
                            <AnomalyDot
                                key={dotProps.index}
                                {...dotProps}
                                dataKey={param.key}
                                fieldMean={s?.mean}
                                fieldStd={s?.std}
                            />
                        )}
                        activeDot={activeDot}
                        connectNulls={false}
                        isAnimationActive={false}
                    />

                    {/* 24-hour moving average overlay — only when enabled */}
                    {showMovingAverage && (
                        <Line
                            type="monotone"
                            dataKey={maKey}
                            name="24h MA"
                            stroke={param.color}
                            strokeWidth={1.5}
                            strokeOpacity={0.45}
                            strokeDasharray="6 3"
                            dot={false}
                            activeDot={false}
                            connectNulls
                            isAnimationActive={false}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
});

// ─── Main Export — memoized ───────────────────────────────────────────────────
const OceanChart = memo(function OceanChart({ data, activeParams, showMovingAverage = false }) {
    const chartData = useMemo(() => {
        // Build formatted rows
        const rows = data.map((row) => ({
            ...row,
            label: (() => {
                try {
                    const d = new Date(row.timestamp);
                    return d.toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                } catch { return row.timestamp; }
            })(),
        }));

        // Inject MA columns for every active param
        if (showMovingAverage) {
            PARAMETERS
                .filter((p) => activeParams.includes(p.key))
                .forEach((p) => {
                    const maValues = computeMovingAverage(data, p.key, 24);
                    maValues.forEach((v, i) => { rows[i][`${p.key}_ma`] = v; });
                });
        }

        return rows;
    }, [data, activeParams, showMovingAverage]);

    const stats = useMemo(
        () => Object.fromEntries(
            PARAMETERS
                .filter((p) => activeParams.includes(p.key))
                .map((p) => [p.key, computeStats(data, p.key)])
        ),
        [data, activeParams]
    );

    // Memoized param list — only re-derives when activeParams changes
    const paramsToRender = useMemo(
        () => PARAMETERS.filter((p) => activeParams.includes(p.key)),
        [activeParams]
    );

    if (!data.length) {
        return (
            <div className="glass-card flex items-center justify-center" style={{ height: 300, color: '#4db8e8' }}>
                No data available — check your backend connection.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {paramsToRender.map((param) => (
                <ParamChart
                    key={param.key}
                    param={param}
                    chartData={chartData}
                    stats={stats}
                    showMovingAverage={showMovingAverage}
                />
            ))}
        </div>
    );
});

export default OceanChart;

// Expose computeAllStats for App.jsx
OceanChart.computeStats = (data, activeParams) =>
    Object.fromEntries(
        PARAMETERS
            .filter((p) => activeParams.includes(p.key))
            .map((p) => [p.key, computeStats(data, p.key)])
    );
