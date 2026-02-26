# Ocean Blue – Ocean Data Explorer

Interactive dashboard for NOAA RAMA Indian Ocean buoy data built with React + Vite, Tailwind CSS v4, Recharts, and Supabase.

---

## Project Structure

```
ocean-blue/
├── data/
│   └── rama_23003_sample.csv      # Sample NOAA CSV seed data
├── database/
│   └── schema.sql                 # Supabase table + index definitions
├── scripts/
│   └── load_data.js               # Node.js CSV parser & Supabase uploader
├── src/
│   ├── components/
│   │   ├── LoadingSpinner.jsx
│   │   ├── OceanChart.jsx         # Recharts ComposedChart + anomaly detection
│   │   ├── Sidebar.jsx            # Station selector, year sliders, param toggles
│   │   └── StatsCards.jsx        # Mean / Min / Max / Std / Anomaly count cards
│   ├── data/
│   │   ├── constants.js           # Station list, parameter definitions
│   │   └── demoData.js            # In-memory fallback data
│   ├── hooks/
│   │   └── useOceanData.js        # Supabase fetch hook with demo fallback
│   ├── lib/
│   │   └── supabase.js            # Supabase client init
│   ├── utils/
│   │   └── stats.js               # mean, stdDev, isAnomaly, computeStats
│   ├── App.jsx                    # Root layout
│   ├── index.css                  # Tailwind + custom ocean theme tokens
│   └── main.jsx                   # React entry point
├── .env.example
├── index.html
└── vite.config.js
```

---

## 1 · Run Locally (immediate – no Supabase needed)

```bash
cd ocean-blue
npm install          # already done if you ran the scaffold
npm run dev
```

Open **http://localhost:5173** — the app runs in **Demo Mode** with bundled seed data.

---

## 2 · Supabase Setup

### 2.1 Create a project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon/public key**

### 2.2 Create the table

In the Supabase **SQL Editor**, paste and run:

```sql
-- full script is in database/schema.sql
```

Or run the file directly:

```bash
# Using the Supabase CLI (optional)
supabase db push --db-url "postgresql://..."
```

### 2.3 Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 3 · Load NOAA Data

```bash
# Install loader dependencies
npm install csv-parse dotenv

# Add service role key for writes (MORE permissive than anon key)
# In .env.local:  SUPABASE_SERVICE_KEY=your-service-key

node scripts/load_data.js data/rama_23003_sample.csv
```

The script:
- Parses the CSV
- Cleans NOAA missing-value sentinels (`999.000`, `9999`, etc.)
- Batches inserts (500 rows/batch) via `upsert` (idempotent re-runs)

---

## 4 · Features

| Feature | Detail |
|---------|--------|
| Station selector | RAMA 23003 (Indian Ocean) + 2 placeholder stations |
| Year range slider | Dual sliders for start/end year |
| Parameter toggles | SST · Wind Speed · Air Pressure |
| Line chart | Per-parameter with custom tooltip |
| Mean reference line | Dashed cyan line at μ |
| Anomaly threshold | Dashed red line at μ+2σ |
| Anomaly dots | Red circles on outlier points |
| Stats cards | Mean · Min · Max · Std Dev · Anomaly count |
| Demo mode | Works offline without Supabase |
| Error handling | Falls back to demo data on Supabase errors |
| Loading state | Animated ocean ring spinner |

---

## 5 · Anomaly Detection Logic

```js
isAnomaly = value > mean + 2 * standardDeviation
```

Anomalies appear as red circles on the chart and are counted in the summary stats.

---

## 6 · Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite 7 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Charts | Recharts 2 |
| Backend | Supabase (PostgreSQL) |
| Data source | NOAA RAMA Buoy Array |
