import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchBuoyData } from '../services/api';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * useBuoyData
 * Fetches live hourly buoy data from the local Express server.
 * Auto-refreshes every 5 minutes. Cleans up on unmount.
 * Exposes pauseRefresh / resumeRefresh so callers can suppress
 * background polling while the live panel is not visible.
 *
 * @param {number} lat  – latitude
 * @param {number} lon  – longitude
 */
export function useBuoyData(lat, lon) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const timerRef = useRef(null);
    const pausedRef = useRef(false); // tracks whether polling is paused

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const rows = await fetchBuoyData(lat, lon);
            setData(rows);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err.message || 'Failed to fetch buoy data');
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [lat, lon]);

    // Stable interval ticker: only fires fetch if not paused
    const tick = useCallback(() => {
        if (!pausedRef.current) fetchData();
    }, [fetchData]);

    // Initial fetch + set up auto-refresh interval
    useEffect(() => {
        fetchData();

        timerRef.current = setInterval(tick, REFRESH_INTERVAL_MS);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [fetchData, tick]);

    /** Suppress background polling (e.g. when historical mode is active). */
    const pauseRefresh = useCallback(() => {
        pausedRef.current = true;
    }, []);

    /** Resume background polling and trigger an immediate refresh. */
    const resumeRefresh = useCallback(() => {
        pausedRef.current = false;
        fetchData(); // catch up with any missed interval
    }, [fetchData]);

    return { data, loading, error, lastUpdated, refetch: fetchData, pauseRefresh, resumeRefresh };
}
