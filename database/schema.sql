-- ==============================================
-- Ocean Blue – Supabase Schema
-- Run this in the Supabase SQL Editor
-- ==============================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS ocean_data (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id     TEXT        NOT NULL,
  year           INTEGER     NOT NULL,
  month          INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  sea_surface_temp  FLOAT,
  wind_speed        FLOAT,
  air_pressure      FLOAT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast filtered queries
CREATE INDEX IF NOT EXISTS idx_ocean_data_station ON ocean_data (station_id);
CREATE INDEX IF NOT EXISTS idx_ocean_data_year    ON ocean_data (year);
CREATE INDEX IF NOT EXISTS idx_ocean_data_station_year ON ocean_data (station_id, year);

-- Optional: enable Row Level Security (read-only public access)
ALTER TABLE ocean_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON ocean_data FOR SELECT
  USING (true);
