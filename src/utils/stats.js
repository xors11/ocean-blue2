/**
 * Calculate mean of an array of numbers (null values are ignored).
 */
export function mean(values) {
    const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (!valid.length) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/**
 * Calculate population standard deviation.
 */
export function stdDev(values) {
    const valid = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (valid.length < 2) return 0;
    const avg = mean(valid);
    const variance = valid.reduce((sum, v) => sum + (v - avg) ** 2, 0) / valid.length;
    return Math.sqrt(variance);
}

/**
 * Given a dataset row and the statistical summary for a field,
 * return true if the value is anomalous (> mean + 2 * std).
 */
export function isAnomaly(value, fieldMean, fieldStd) {
    if (value === null || value === undefined) return false;
    return value > fieldMean + 2 * fieldStd;
}

/**
 * Build full statistics summary for a given field across rows.
 * @param {Array}  rows   - array of data objects
 * @param {string} field  - field name to analyse
 * @returns {{ mean, min, max, std, anomalyThreshold }}
 */
export function computeStats(rows, field) {
    const values = rows.map((r) => r[field]).filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (!values.length) return { mean: null, min: null, max: null, std: null, anomalyThreshold: null };

    const avg = mean(values);
    const sd = stdDev(values);

    return {
        mean: avg,
        min: Math.min(...values),
        max: Math.max(...values),
        std: sd,
        anomalyThreshold: avg + 2 * sd,
    };
}
