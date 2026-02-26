/**
 * utils/anomaly.js
 * Pure statistical helpers for anomaly detection and analytics.
 * No side effects, no imports — easily unit-testable.
 */

/** Arithmetic mean of a numeric array (nulls ignored). */
export function mean(values) {
    const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (!valid.length) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/** Population standard deviation (nulls ignored). */
export function stdDev(values) {
    const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (valid.length < 2) return 0;
    const avg = mean(valid);
    return Math.sqrt(valid.reduce((s, v) => s + (v - avg) ** 2, 0) / valid.length);
}

/** Z-score of a single value given pre-computed mean and std. */
export function zScore(value, fieldMean, fieldStd) {
    if (value === null || value === undefined || isNaN(value)) return null;
    if (fieldStd === 0) return 0;
    return (value - fieldMean) / fieldStd;
}

/**
 * Classify a point by its absolute Z-score.
 * |z| < 2      → 'normal'
 * 2 ≤ |z| < 3 → 'moderate'
 * |z| ≥ 3      → 'extreme'
 */
export function classifyAnomaly(z) {
    if (z === null) return 'normal';
    const absZ = Math.abs(z);
    if (absZ >= 3) return 'extreme';
    if (absZ >= 2) return 'moderate';
    return 'normal';
}

/**
 * Returns true if `value` exceeds the μ + 2σ anomaly threshold.
 * Kept for backwards compatibility with existing dot renderers.
 */
export function isAnomaly(value, fieldMean, fieldStd) {
    if (value === null || value === undefined || isNaN(value)) return false;
    return value > fieldMean + 2 * fieldStd;
}

/**
 * Detect trend by comparing the average of the first 20% vs last 20% of values.
 * Returns 'Increasing', 'Decreasing', or 'Stable'.
 * Threshold: a relative change of less than ±1% is considered Stable.
 */
export function trendDirection(values) {
    const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (valid.length < 5) return 'Stable';

    const chunk = Math.max(1, Math.floor(valid.length * 0.2));
    const firstAvg = mean(valid.slice(0, chunk));
    const lastAvg = mean(valid.slice(valid.length - chunk));

    if (firstAvg === null || lastAvg === null || firstAvg === 0) return 'Stable';

    const relChange = (lastAvg - firstAvg) / Math.abs(firstAvg);
    if (relChange > 0.01) return 'Increasing';
    if (relChange < -0.01) return 'Decreasing';
    return 'Stable';
}

/**
 * Compute a simple moving average for a field across rows.
 * Returns a new array of the same length where each element is the
 * average of the preceding `window` values (or fewer at the start).
 * Null values are skipped for calculations but their position is preserved.
 *
 * @param {Array<object>} rows
 * @param {string}        field
 * @param {number}        window  default 24 (24-hour moving average)
 * @returns {Array<number|null>}  parallel to rows
 */
export function computeMovingAverage(rows, field, window = 24) {
    const result = new Array(rows.length).fill(null);
    for (let i = 0; i < rows.length; i++) {
        const start = Math.max(0, i - window + 1);
        const slice = rows.slice(start, i + 1)
            .map((r) => r[field])
            .filter((v) => v !== null && v !== undefined && !isNaN(v));
        if (slice.length > 0) {
            result[i] = slice.reduce((a, b) => a + b, 0) / slice.length;
        }
    }
    return result;
}

/**
 * Compute full stats summary for one field across a dataset,
 * including Z-score-based anomaly classification counts.
 *
 * @param {Array<object>} rows
 * @param {string}        field
 * @returns {{
 *   mean, min, max, std,
 *   anomalyThreshold,
 *   anomalyCount,   — total (|z| >= 2)
 *   moderateCount,  — 2 ≤ |z| < 3
 *   extremeCount,   — |z| >= 3
 * }}
 */
export function computeStats(rows, field) {
    const values = rows
        .map((r) => r[field])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));

    if (!values.length) {
        return {
            mean: null, min: null, max: null, std: null,
            anomalyThreshold: null,
            anomalyCount: 0, moderateCount: 0, extremeCount: 0,
            trend: 'Stable',
        };
    }

    const avg = mean(values);
    const sd = stdDev(values);
    const threshold = avg + 2 * sd;

    let anomalyCount = 0;
    let moderateCount = 0;
    let extremeCount = 0;

    for (const v of values) {
        const z = zScore(v, avg, sd);
        const cls = classifyAnomaly(z);
        if (cls === 'extreme') { extremeCount++; anomalyCount++; }
        else if (cls === 'moderate') { moderateCount++; anomalyCount++; }
    }

    return {
        mean: avg,
        min: Math.min(...values),
        max: Math.max(...values),
        std: sd,
        anomalyThreshold: threshold,
        anomalyCount,
        moderateCount,
        extremeCount,
        trend: trendDirection(values),
    };
}

/**
 * Build a stats map for all requested field keys.
 * @param {Array<object>}  rows
 * @param {Array<string>}  fields
 * @returns {Record<string, ReturnType<computeStats>>}
 */
export function computeAllStats(rows, fields) {
    return Object.fromEntries(fields.map((f) => [f, computeStats(rows, f)]));
}
