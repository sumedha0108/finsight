import React, { useState } from 'react';
import axios from 'axios';

interface AddSymbolProps {
  onAdded: () => void;
}

const AddSymbol: React.FC<AddSymbolProps> = ({ onAdded }) => {
  const [symbol, setSymbol] = useState('');
  const [type, setType] = useState('stock');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdd = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:8000/symbols/add', {
        symbol: symbol.toUpperCase().trim(),
        type
      });
      setMessage(`✅ ${symbol.toUpperCase()} added`);
      setSymbol('');
      onAdded(); // refresh dashboard
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.detail || 'Failed to add symbol'}`)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#1a1d27',
      border: '1px solid #2a2d3a',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '20px'
    }}>
      <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        Track a Symbol
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. WIPRO.NS or NVDA"
          style={{
            flex: 1,
            background: '#0f1117',
            border: '1px solid #2a2d3a',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{
            background: '#0f1117',
            border: '1px solid #2a2d3a',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="stock">Stock</option>
          <option value="crypto">Crypto</option>
        </select>
        <button
          onClick={handleAdd}
          disabled={loading}
          style={{
            background: '#4a9eff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: '#fff',
            fontSize: '14px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '...' : 'Add'}
        </button>
      </div>
      {message && (
        <div style={{ marginTop: '8px', fontSize: '13px', color: message.startsWith('✅') ? '#00c851' : '#ff4444' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AddSymbol;