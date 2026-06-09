import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ExplanationModalProps {
  symbol: string;
  onClose: () => void;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ symbol, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`http://localhost:8000/explain/${symbol}`),
      axios.get(`http://localhost:8000/prices/${symbol}?limit=30`)
    ])
      .then(([explainRes, historyRes]) => {
        setData(explainRes.data);
        // reverse so oldest is first on chart
        setHistory([...historyRes.data.history].reverse());
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [symbol]);

  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}
    onClick={onClose}
    >
      <div style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3a',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '620px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto'
      }}
      onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px' }}>{cleanSymbol}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none',
            color: '#fff', fontSize: '20px', cursor: 'pointer'
          }}>✕</button>
        </div>

        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
            Loading...
          </div>
        ) : (
          <>
            {/* Price Chart */}
            {history.length > 1 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Price History
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={history}>
                    <XAxis
                      dataKey="fetched_at"
                      tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      tick={{ fill: '#666', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fill: '#666', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{ background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '8px' }}
                      labelFormatter={(val) => new Date(val).toLocaleString()}
                      formatter={(val: any) => [val.toLocaleString(), 'Price']}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#4a9eff"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Explanation */}
            {data?.explanation && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  AI Analysis
                </div>
                <div style={{
                  background: '#0f1117',
                  borderRadius: '10px',
                  padding: '16px',
                  color: '#ccc',
                  lineHeight: '1.7',
                  fontSize: '14px'
                }}>
                  {data.explanation}
                </div>
              </div>
            )}

            {/* Stats */}
            {data?.anomaly && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {[
                  { label: 'Severity', value: data.anomaly.severity },
                  { label: 'Change', value: `${data.anomaly.change_pct?.toFixed(2)}%` },
                  { label: 'Z-score', value: data.anomaly.z_score },
                  { label: 'Model', value: data.model || 'AI' },
                ].map(stat => (
                  <span key={stat.label} style={{
                    background: '#2a2d3a',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    color: '#ccc'
                  }}>
                    {stat.label}: {stat.value}
                  </span>
                ))}
              </div>
            )}

            {/* News Sources */}
            {data?.news && data.news.length > 0 && (
              <div>
                <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  News Sources
                </div>
                {data.news.map((n: any, i: number) => (
                  <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{
                    display: 'block',
                    color: '#4a9eff',
                    fontSize: '13px',
                    marginBottom: '6px',
                    textDecoration: 'none'
                  }}>
                    → {n.title}
                  </a>
                ))}
              </div>
            )}

            {/* No anomaly message */}
            {!data?.anomaly && (
              <div style={{ color: '#666', fontSize: '14px' }}>
                No anomaly detected for this symbol yet. Check back during market hours.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExplanationModal;