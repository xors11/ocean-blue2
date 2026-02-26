#!/usr/bin/env node
/**
 * Ocean Blue – NOAA CSV Data Loader
 * Parses a NOAA/RAMA CSV, cleans missing values, and upserts into Supabase.
 *
 * Usage:
 *   node scripts/load_data.js ./data/rama_23003_sample.csv
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js csv-parse dotenv
 *   Create a .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌  Missing SUPABASE_URL / SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// NOAA uses 999.000 (or similar) as the missing-value sentinel
const MISSING_SENTINELS = [999, 999.0, 9999, -9999, -999];
const isMissing = (v) => v === null || v === undefined || MISSING_SENTINELS.includes(Number(v));

const parseFloat2 = (v) => {
    const n = parseFloat(v);
    return isMissing(n) ? null : n;
};

const parseIntSafe = (v) => {
    const n = parseInt(v, 10);
    return isNaN(n) ? null : n;
};

async function loadCSV(filePath) {
    const rows = [];
    await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
            .on('data', (row) => {
                const record = {
                    station_id: String(row.station_id || '').trim(),
                    year: parseIntSafe(row.year),
                    month: parseIntSafe(row.month),
                    sea_surface_temp: parseFloat2(row.sea_surface_temp),
                    wind_speed: parseFloat2(row.wind_speed),
                    air_pressure: parseFloat2(row.air_pressure),
                };

                // Drop rows with missing required fields
                if (!record.station_id || !record.year || !record.month) return;

                rows.push(record);
            })
            .on('end', resolve)
            .on('error', reject);
    });
    return rows;
}

async function main() {
    const csvFile = process.argv[2];
    if (!csvFile) {
        console.error('Usage: node scripts/load_data.js <path-to-csv>');
        process.exit(1);
    }

    const filePath = path.resolve(csvFile);
    console.log(`📂 Loading: ${filePath}`);

    const rows = await loadCSV(filePath);
    console.log(`📝 Parsed ${rows.length} valid rows`);

    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
            .from('ocean_data')
            .upsert(batch, { onConflict: 'station_id,year,month' });

        if (error) {
            console.error(`❌  Batch ${i / BATCH_SIZE + 1} error:`, error.message);
        } else {
            inserted += batch.length;
            console.log(`✅  Inserted batch ${i / BATCH_SIZE + 1} (${inserted}/${rows.length})`);
        }
    }

    console.log(`\n🎉 Done! Total inserted: ${inserted} rows`);
}

main().catch((err) => { console.error(err); process.exit(1); });
