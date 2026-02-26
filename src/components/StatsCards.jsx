import React from 'react';
import { PARAMETERS } from '../data/constants';

function StatCard({ label, value, unit, icon, color }) {
    return (
        <div
            className="glass-card flex flex-col gap-1.5 p-4"
            style={{ flex: 1, minWidth: 120, position: 'relative', overflow: 'hidden' }}
        >
            {/* Background glow */}
            <div
                style={{
                    position: 'absolute', top: -20, right: -20,
                    width: 70, height: 70,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}30, transparent 70%)`,
                    pointerEvents: 'none',
                }}
            />
            <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: '#4db8e8', textTransform: 'uppercase' }}>
                {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color }}>
                    {value !== null && value !== undefined ? Number(value).toFixed(2) : '—'}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#4db8e8' }}>{unit}</span>
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{icon}</div>
        </div>
    );
}

export default function StatsCards({ stats, activeParams, dataCount }) {
    return (
        <div className="flex flex-col gap-4">
            {activeParams.map((pKey) => {
                const param = PARAMETERS.find((p) => p.key === pKey);
                if (!param) return null;
                const s = stats[pKey];
                if (!s) return null;

                return (
                    <div key={pKey}>
                        {/* Parameter header */}
                        <div
                            className="flex items-center gap-2 mb-2"
                            style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: param.color, textTransform: 'uppercase' }}
                        >
                            <div style={{ width: 3, height: 14, borderRadius: 2, background: param.color }} />
                            {param.label}
                        </div>
                        {/* Stat cards row */}
                        <div className="flex gap-3 flex-wrap">
                            <StatCard label="Mean" value={s.mean} unit={param.unit} color={param.color} icon="〜" />
                            <StatCard label="Min" value={s.min} unit={param.unit} color="#4db8e8" icon="↓" />
                            <StatCard label="Max" value={s.max} unit={param.unit} color="#00d4ff" icon="↑" />
                            <StatCard label="Std Dev" value={s.std} unit={param.unit} color="#87d4f4" icon="σ" />
                            {/* Anomaly count */}
                            {s.anomalyCount !== undefined && (
                                <div
                                    className="glass-card flex flex-col gap-1.5 p-4"
                                    style={{ flex: 1, minWidth: 120, position: 'relative', overflow: 'hidden' }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute', top: -20, right: -20,
                                            width: 70, height: 70,
                                            borderRadius: '50%',
                                            background: 'radial-gradient(circle, #ff4d6d30, transparent 70%)',
                                            pointerEvents: 'none',
                                        }}
                                    />
                                    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: '#ff4d6d', textTransform: 'uppercase' }}>
                                        Anomalies
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ff4d6d' }}>
                                            {s.anomalyCount}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: '#ff4d6d80' }}>/ {dataCount}</span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#ff4d6d80' }}>μ+2σ rule</div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
