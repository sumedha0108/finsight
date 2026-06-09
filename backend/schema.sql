CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    coin_id TEXT
);

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    symbol TEXT NOT NULL,
    price FLOAT NOT NULL,
    change_pct FLOAT,
    currency TEXT,
    type TEXT,
    exchange TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL,
    severity TEXT,
    change_pct FLOAT,
    z_score FLOAT,
    direction TEXT,
    explanation TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sentiment (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    overall TEXT,
    positive_count INT,
    negative_count INT,
    neutral_count INT,
    reasoning TEXT,
    headlines JSONB,
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);
