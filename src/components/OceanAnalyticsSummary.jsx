import React, { useMemo, memo } from 'react';
import { computeStats } from '../utils/anomaly';

// ─── Param config for Live mode ───────────────────────────────────────────────
export const LIVE_ANALYTICS_PARAMS = [
    { key: 'sea_surface_temp', label: 'Sea Surface Temperature', unit: '°C', color: '#00d4ff' },
    { key: 'wind_speed', label: 'Wind Speed', unit: 'm/s', color: '#4db8e8' },
    { key: 'wave_height', label: 'Wave Height', unit: 'm', color: '#38bdf8' },
    { key: 'air_pressure', label: 'Air Pressure', unit: 'hPa', color: '#fbbf24' },
];

// ─── Param config for Historical mode ─────────────────────────────────────────
export const HIST_ANALYTICS_PARAMS = [
    { key: 'WTMP', label: 'Sea Surface Temperature', unit: '°C', color: '#00d4ff' },
    { key: 'WSPD', label: 'Wind Speed', unit: 'm/s', color: '#4db8e8' },
    { key: 'WVHT', label: 'Wave Height', unit: 'm', color: '#38bdf8' },
    { key: 'PRES', label: 'Air Pressure', unit: 'hPa', color: '#fbbf24' },
];

// ─── Trend badge ──────────────────────────────────────────────────────────────
function TrendBadge({ trend }) {
    const map = {
        Increasing: { icon: '▲', color: '#34d399', label: 'Increasing' },
        Decreasing: { icon: '▼', color: '#f87171', label: 'Decreasing' },
        Stable: { icon: '━', color: '#4db8e8', label: 'Stable' },
    };
    const t = map[trend] || map.Stable;
    return (
        <span
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: `${t.color}18`,
                border: `1px solid ${t.color}40`,
                borderRadius: 99, padding: '0.18rem 0.55rem',
                fontSize: '0.68rem', fontWeight: 700, color: t.color,
                letterSpacing: '0.03em',
            }}
        >
            {t.icon} {t.label}
        </span>
    );
}

// ─── Micro stat pill ──────────────────────────────────────────────────────────
function StatPill({ label, value, unit, color }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 70 }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#4db8e8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color }}>
                {value !== null && value !== undefined ? Number(value).toFixed(2) : '—'}
                <span style={{ fontSize: '0.62rem', fontWeight: 500, color: '#4db8e880', marginLeft: 2 }}>{unit}</span>
            </span>
        </div>
    );
}

// ─── Single analytics card ────────────────────────────────────────────────────
const AnalyticsCard = memo(function AnalyticsCard({ param, stats }) {
    const s = stats[param.key];
    if (!s) return null;

    const hasAnomalies = s.anomalyCount > 0;

    return (
        <div
            className="glass-card p-5"
            style={{ position: 'relative', overflow: 'hidden' }}
        >
            {/* Background glow */}
            <div style={{
                position: 'absolute', top: -24, right: -24,
                width: 90, height: 90, borderRadius: '50%',
                background: `radial-gradient(circle, ${param.color}22, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: param.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: param.color }}>
                        {param.label}
                    </span>
                </div>
                <TrendBadge trend={s.trend} />
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: hasAnomalies ? '0.9rem' : 0 }}>
                <StatPill label="Mean" value={s.mean} unit={param.unit} color={param.color} />
                <StatPill label="Min" value={s.min} unit={param.unit} color="#4db8e8" />
                <StatPill label="Max" value={s.max} unit={param.unit} color="#00d4ff" />
                <StatPill label="Std Dev" value={s.std} unit={param.unit} color="#87d4f4" />
            </div>

            {/* Anomaly summary */}
            {hasAnomalies && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid rgba(36,144,204,0.12)' }}>
                    {/* Total */}
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(255,77,109,0.10)', border: '1px solid rgba(255,77,109,0.28)',
                        borderRadius: 99, padding: '0.18rem 0.55rem',
                        fontSize: '0.68rem', color: '#ff4d6d', fontWeight: 700,
                    }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff4d6d', display: 'inline-block' }} />
                        {s.anomalyCount} anomal{s.anomalyCount === 1 ? 'y' : 'ies'}
                    </span>

                    {/* Moderate */}
                    {s.moderateCount > 0 && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'rgba(251,146,60,0.10)', border: '1px solid rgba(251,146,60,0.28)',
                            borderRadius: 99, padding: '0.18rem 0.55rem',
                            fontSize: '0.68rem', color: '#fb923c', fontWeight: 700,
                        }}>
                            {s.moderateCount} moderate
                        </span>
                    )}

                    {/* Extreme */}
                    {s.extremeCount > 0 && (
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.28)',
                            borderRadius: 99, padding: '0.18rem 0.55rem',
                            fontSize: '0.68rem', color: '#ef4444', fontWeight: 700,
                        }}>
                            {s.extremeCount} extreme
                        </span>
                    )}
                </div>
            )}
        </div>
    );
});

// ─── Main analytics summary panel ─────────────────────────────────────────────
const OceanAnalyticsSummary = memo(function OceanAnalyticsSummary({ data, params }) {
    // Heavy computation gated by useMemo — only recalculates when data changes
    const stats = useMemo(() => {
        if (!data || !data.length) return {};
        return Object.fromEntries(params.map((p) => [p.key, computeStats(data, p.key)]));
    }, [data, params]);

    if (!data || !data.length) return null;

    return (
        <div>
            {/* Section header */}
            <div style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em',
                color: '#4db8e8', textTransform: 'uppercase', marginBottom: '0.75rem',
            }}>
                Ocean Analytics Summary
            </div>

            {/* Grid of cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
            }}>
                {params.map((param) => (
                    <AnalyticsCard key={param.key} param={param} stats={stats} />
                ))}
            </div>
        </div>
    );
});

export default OceanAnalyticsSummary;
