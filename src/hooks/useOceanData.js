import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { DEMO_DATA } from '../data/demoData';

/**
 * useOceanData
 * Fetches ocean data from Supabase (or falls back to demo data).
 *
 * @param {string} stationId  - selected station
 * @param {number} yearStart  - inclusive start year
 * @param {number} yearEnd    - inclusive end year
 */
export function useOceanData(stationId, yearStart, yearEnd) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDemo, setIsDemo] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        // ── Demo mode (no Supabase configured) ───────────────────────────────
        if (!supabase) {
            const filtered = DEMO_DATA.filter(
                (r) =>
                    r.station_id === stationId &&
                    r.year >= yearStart &&
                    r.year <= yearEnd
            );
            // Simulate a network delay so loading state is visible
            await new Promise((res) => setTimeout(res, 400));
            setData(filtered);
            setIsDemo(true);
            setLoading(false);
            return;
        }

        // ── Supabase mode ────────────────────────────────────────────────────
        try {
            const { data: rows, error: sbError } = await supabase
                .from('ocean_data')
                .select('station_id, year, month, sea_surface_temp, wind_speed, air_pressure')
                .eq('station_id', stationId)
                .gte('year', yearStart)
                .lte('year', yearEnd)
                .order('year', { ascending: true })
                .order('month', { ascending: true });

            if (sbError) throw sbError;
            setData(rows || []);
            setIsDemo(false);
        } catch (err) {
            setError(err.message || 'Failed to fetch data');
            // Graceful fallback to demo data on error
            const filtered = DEMO_DATA.filter(
                (r) =>
                    r.station_id === stationId &&
                    r.year >= yearStart &&
                    r.year <= yearEnd
            );
            setData(filtered);
            setIsDemo(true);
        } finally {
            setLoading(false);
        }
    }, [stationId, yearStart, yearEnd]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, loading, error, isDemo, refetch: fetchData };
}
