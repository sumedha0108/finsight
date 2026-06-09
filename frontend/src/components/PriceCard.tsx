import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PriceCardProps {
  symbol: string;
  price: number;
  change_pct: number;
  currency: string;
  exchange: string;
  onClick: () => void;
  hasAnomaly: boolean;
  onDeleted: () => void;
}

const sentimentColor: Record<string, string> = {
  bullish: '#00c851',
  bearish: '#ff4444',
  neutral: '#ffcc00'
};

const sentimentEmoji: Record<string, string> = {
  bullish: '🟢',
  bearish: '🔴',
  neutral: '🟡'
};

const PriceCard: React.FC<PriceCardProps> = ({
  symbol, price, change_pct, currency,
  exchange, onClick, hasAnomaly, onDeleted
}) => {
  const isPositive = change_pct >= 0;
  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sentiment, setSentiment] = useState<any>(null);
  const [showSentiment, setShowSentiment] = useState(false);

  useEffect(() => {
    // fetch cached sentiment from DB on load
    axios.get(`http://localhost:8000/sentiment/${symbol}`)
      .then(res => {
        if (res.data?.overall) setSentiment(res.data);
      })
      .catch(() => {});
  }, [symbol]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/symbols/${symbol}`);
      onDeleted();
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => { setShowDelete(false); setShowSentiment(false); }}
      style={{
        background: hasAnomaly
          ? change_pct > 0 ? '#0d1f14' : '#1a1020'
          : '#1a1d27',
        border: hasAnomaly
          ? change_pct > 0 ? '1px solid #00c851' : '1px solid #ff4444'
          : '1px solid #2a2d3a',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        position: 'relative'
      }}
    >
      {/* Delete button */}
      {showDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#ff4444',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '11px',
            padding: '3px 7px',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          {deleting ? '...' : '✕'}
        </button>
      )}

      {hasAnomaly && (
        <div style={{
          color: change_pct > 0 ? '#00c851' : '#ff4444',
          fontSize: '11px',
          marginBottom: '6px'
        }}>
          {change_pct > 0 ? '▲ UNUSUAL SURGE' : '▼ UNUSUAL DROP'}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{cleanSymbol}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{exchange}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {currency === 'INR' ? '₹' : '$'}{price.toLocaleString()}
          </div>
          <div style={{
            fontSize: '14px',
            color: isPositive ? '#00c851' : '#ff4444',
            marginTop: '2px'
          }}>
            {isPositive ? '▲' : '▼'} {Math.abs(change_pct).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Sentiment badge at bottom */}
      {sentiment && (
        <div
          onClick={e => { e.stopPropagation(); setShowSentiment(!showSentiment); }}
          style={{
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: sentimentColor[sentiment.overall],
            borderTop: '1px solid #2a2d3a',
            paddingTop: '8px'
          }}
        >
          {sentimentEmoji[sentiment.overall]} {sentiment.overall.toUpperCase()}
          <span style={{ color: '#555', marginLeft: 'auto' }}>
            {sentiment.positive_count}↑ {sentiment.negative_count}↓ {sentiment.neutral_count}→
          </span>
        </div>
      )}

      {/* Sentiment tooltip on click */}
      {showSentiment && sentiment && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '0',
            right: '0',
            background: '#0f1117',
            border: `1px solid ${sentimentColor[sentiment.overall]}`,
            borderRadius: '10px',
            padding: '12px',
            zIndex: 100,
            fontSize: '12px'
          }}
        >
          <div style={{ color: '#ccc', marginBottom: '8px' }}>
            {sentiment.reasoning}
          </div>
          {sentiment.headlines?.map((h: any, i: number) => (
            <div key={i} style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '4px',
              color: h.sentiment === 'positive' ? '#00c851' : h.sentiment === 'negative' ? '#ff4444' : '#ffcc00'
            }}>
              <span>{h.sentiment === 'positive' ? '▲' : h.sentiment === 'negative' ? '▼' : '→'}</span>
              <span style={{ color: '#888', fontSize: '11px' }}>{h.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceCard;