import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PriceCard from './components/PriceCard';
import AnomalyPanel from './components/AnomalyPanel';
import ExplanationModal from './components/ExplanationModal';
import AddSymbol from './components/AddSymbol';

const API = 'http://localhost:8000';

function App() {
  const [prices, setPrices] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [pricesRes, anomaliesRes] = await Promise.all([
        axios.get(`${API}/prices`),
        axios.get(`${API}/anomalies`)
      ]);
      setPrices(pricesRes.data.prices || []);
      setAnomalies(anomaliesRes.data.anomalies || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const anomalySymbols = new Set(anomalies.map((a: any) => a.symbol));

  // split by type
  const indianStocks = prices.filter(p => p.exchange === 'NSE' || p.exchange === 'BSE');
  const usStocks = prices.filter(p => p.exchange === 'US');
  const crypto = prices.filter(p => p.exchange === 'CRYPTO');

  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay();
    return day !== 0 && day !== 6;
  };

  const [checking, setChecking] = useState(false);

  const handleCheckAnomalies = async () => {
    setChecking(true);
    try {
      // step 1 — detect anomalies
      const detectRes = await axios.get(`${API}/anomalies/detect`);
      const anomalies = detectRes.data.anomalies || [];
      console.log(anomalies);
      const count = detectRes.data.anomalies_found;

      // step 2 — explain each detected anomaly
      if (anomalies.length > 0) {
        await Promise.all(
          anomalies.map((a: any) => 
            axios.get(`${API}/explain/${a.symbol}`).catch(e => console.error(`explain failed for ${a.symbol}`, e))
          )
        );
        window.alert(`🚨 ${count} anomalies found and explained`);
      } else {
        window.alert('✅ No anomalies detected');
      }

      await fetchData(); // refresh dashboard
    } catch (err) {
      window.alert('❌ Check failed');
      console.error(err);
    } finally {
      setChecking(false);
    }
  };

  const [clearing, setClearing] = useState(false);

  const handleClearAnomalies = async () => {
    setClearing(true);
    try {
      await axios.delete(`${API}/anomalies/clear`);
      await fetchData();
      window.alert('🧹 Old anomalies cleared');
    } catch (err) {
      window.alert('❌ Clear failed');
    } finally {
      setClearing(false);
    }
  };

  const [analysing, setAnalysing] = useState(false);

  const handleAnalyseSentiment = async () => {
    setAnalysing(true);
    try {
      const res = await axios.get(`${API}/sentiment/bulk`);
      window.alert(`✅ Sentiment analysed for ${res.data.analyzed} assets`);
      await fetchData();
    } catch (err) {
      window.alert('❌ Sentiment analysis failed');
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            📈 FinSight
          </h1>
          <p style={{ color: '#555', marginTop: '4px', fontSize: '14px' }}>
            AI-powered portfolio anomaly detection
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: isMarketOpen() ? '#00c851' : '#ff4444',
              boxShadow: isMarketOpen() ? '0 0 6px #00c851' : '0 0 6px #ff4444'
            }} />
            <span style={{ fontSize: '13px', color: '#888' }}>
              Market {isMarketOpen() ? 'Open' : 'Closed'}
            </span>
          </div>
          <span style={{ color: '#444', fontSize: '13px' }}>
            Updated {lastUpdated || '...'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* existing refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: '#2a2d3a',
              border: '1px solid #3a3f52',
              borderRadius: '8px',
              color: '#fff',
              padding: '8px 16px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
          </button>

          {/* new check anomalies button */}
          <button
            onClick={handleCheckAnomalies}
            disabled={checking}
            style={{
              background: checking ? '#2a2d3a' : '#ff4444',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              padding: '8px 16px',
              cursor: checking ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: checking ? 0.6 : 1,
              transition: 'background 0.2s'
            }}
          >
            {checking ? '⏳ Checking...' : '⚠️ Check Anomalies'}
          </button>
          <button
            onClick={handleClearAnomalies}
            disabled={clearing}
            style={{
              background: '#2a2d3a',
              border: '1px solid #3a3f52',
              borderRadius: '8px',
              color: '#fff',
              padding: '8px 16px',
              cursor: clearing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: clearing ? 0.6 : 1
            }}
          >
            {clearing ? '🧹 Clearing...' : '🧹 Clear Old'}
          </button>
          <button
            onClick={handleAnalyseSentiment}
            disabled={analysing}
            style={{
              background: '#2a2d3a',
              border: '1px solid #3a3f52',
              borderRadius: '8px',
              color: '#fff',
              padding: '8px 16px',
              cursor: analysing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: analysing ? 0.6 : 1
            }}
          >
            {analysing ? '⏳ Analysing...' : '📰 Analyse Sentiment'}
          </button>
        </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '28px'
      }}>
        {[
          { label: 'Assets Tracked', value: prices.length },
          { label: 'Anomalies Detected', value: anomalies.length, alert: anomalies.length > 0 },
          { label: 'Indian Stocks', value: indianStocks.length },
          { label: 'Crypto', value: crypto.length },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#1a1d27',
            border: `1px solid ${stat.alert ? '#ffcc00' : '#2a2d3a'}`,
            borderRadius: '10px',
            padding: '16px'
          }}>
            <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '28px', fontWeight: 'bold', marginTop: '6px',
              color: stat.alert ? '#ffcc00' : '#fff'
            }}>
              {loading ? '...' : stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>

        {/* Left — Prices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Indian Stocks */}
          <div>
            <h2 style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              🇮🇳 Indian Stocks (NSE)
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {loading
                ? Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
                : indianStocks.map((p: any) => (
                  <PriceCard key={p.symbol} {...p}
                    hasAnomaly={anomalySymbols.has(p.symbol)}
                    onClick={() => setSelectedSymbol(p.symbol)}
                    onDeleted={fetchData}
                  />
                ))}
            </div>
          </div>

          {/* US Stocks */}
          <div>
            <h2 style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              🇺🇸 US Stocks
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {loading
                ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
                : usStocks.map((p: any) => (
                  <PriceCard key={p.symbol} {...p}
                    hasAnomaly={anomalySymbols.has(p.symbol)}
                    onClick={() => setSelectedSymbol(p.symbol)}
                  />
                ))}
            </div>
          </div>

          {/* Crypto */}
          <div>
            <h2 style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              ₿ Crypto
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {loading
                ? Array(2).fill(0).map((_, i) => <SkeletonCard key={i} />)
                : crypto.map((p: any) => (
                  <PriceCard key={p.symbol} {...p}
                    hasAnomaly={anomalySymbols.has(p.symbol)}
                    onClick={() => setSelectedSymbol(p.symbol)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Right — Anomalies */}
        <div>
          <AddSymbol onAdded={fetchData} />
          <h2 style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            ⚠️ Anomalies ({anomalies.length})
          </h2>
          <AnomalyPanel
            anomalies={anomalies}
            onSelect={(symbol) => setSelectedSymbol(symbol)}
          />
        </div>
      </div>

      {selectedSymbol && (
        <ExplanationModal
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
}

// loading skeleton card
const SkeletonCard = () => (
  <div style={{
    background: '#1a1d27',
    border: '1px solid #2a2d3a',
    borderRadius: '12px',
    padding: '20px',
    height: '80px',
    animation: 'pulse 1.5s infinite'
  }}>
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `}</style>
  </div>
);

export default App;