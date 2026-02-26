import { useState, useCallback } from 'react';
import { fetchHistoricalBuoyData } from '../services/api';

/**
 * useHistoricalBuoyData — LAZY version
 *
 * Data is fetched ONLY when `load()` is called for the first time.
 * Subsequent calls to `load()` are no-ops if data is already cached.
 * This prevents re-fetching when the user toggles back and forth.
 */
export function useHistoricalBuoyData() {
    const [allData, setAllData] = useState(null); // null = not yet loaded
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        // ── Guard: skip if already loaded or currently loading ───────────────
        if (allData !== null || loading) return;

        setLoading(true);
        setError(null);
        try {
            const raw = await fetchHistoricalBuoyData();

            const parsed = raw.map((row) => {
                const tsRaw =
                    row.timestamp ?? row.TIMESTAMP ?? row.time ??
                    row.DATE ?? row.date ?? null;

                let ts = null;
                if (tsRaw) {
                    ts = new Date(tsRaw);
                    if (isNaN(ts.getTime())) ts = null;
                }

                return {
                    ...row,
                    timestamp: ts,
                    WTMP: parseFloat(row.WTMP),
                    WSPD: parseFloat(row.WSPD),
                    WVHT: parseFloat(row.WVHT),
                    PRES: parseFloat(row.PRES),
                    year: ts ? ts.getFullYear() : null,
                };
            });

            setAllData(parsed);
        } catch (err) {
            setError(err.message || 'Failed to fetch historical data');
        } finally {
            setLoading(false);
        }
    }, [allData, loading]);

    return {
        allData: allData ?? [],   // always return an array for downstream code
        hasLoaded: allData !== null,
        loading,
        error,
        load,                     // caller triggers fetch on demand
    };
}
