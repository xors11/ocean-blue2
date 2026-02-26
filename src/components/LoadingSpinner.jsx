import React from 'react';

export default function LoadingSpinner({ message = 'Loading data…' }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 360,
                gap: '1.25rem',
            }}
        >
            {/* Animated ocean ring */}
            <div style={{ position: 'relative', width: 60, height: 60 }}>
                <div
                    style={{
                        position: 'absolute', inset: 0,
                        borderRadius: '50%',
                        border: '3px solid rgba(36,144,204,0.15)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute', inset: 0,
                        borderRadius: '50%',
                        border: '3px solid transparent',
                        borderTopColor: '#00d4ff',
                        animation: 'spin 1s linear infinite',
                    }}
                />
                <div
                    style={{
                        position: 'absolute', inset: 8,
                        borderRadius: '50%',
                        border: '2px solid transparent',
                        borderTopColor: 'rgba(0,212,255,0.4)',
                        animation: 'spin 1.6s linear infinite reverse',
                    }}
                />
            </div>
            <div style={{ color: '#4db8e8', fontSize: '0.85rem' }}>{message}</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
