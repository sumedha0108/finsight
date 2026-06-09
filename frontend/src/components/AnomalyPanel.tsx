import React from 'react';

interface Anomaly {
  id: string;
  symbol: string;
  severity: string;
  change_pct: number;
  detected_at: string;
  explanation: string;
  direction: string;
}

interface AnomalyPanelProps {
  anomalies: Anomaly[];
  onSelect: (symbol: string) => void;
}

const severityColor = (anomaly: Anomaly) => {
  if (anomaly.direction === 'up') {
    return {
      severe: '#00c851',
      moderate: '#00a844',
      mild: '#80ff80'
    }[anomaly.severity] || '#00c851';
  }
  return {
    severe: '#ff4444',
    moderate: '#ff9900',
    mild: '#ffcc00'
  }[anomaly.severity] || '#ff4444';
};

const AnomalyPanel: React.FC<AnomalyPanelProps> = ({ anomalies, onSelect }) => {
  if (anomalies.length === 0) {
    return (
      <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
        No anomalies detected yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {anomalies.map((a) => (
        <div
          key={a.id}
          onClick={() => onSelect(a.symbol)}
          style={{
            background: '#1a1d27',
            border: `1px solid ${severityColor(a)}`,
            borderRadius: '10px',
            padding: '14px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>
              {a.symbol.replace('.NS', '')}
            </span>
            <span style={{
              color: severityColor(a),
              fontSize: '12px',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}>
              {a.direction === 'up' ? '▲' : '▼'} {a.severity}
            </span>
          </div>
          <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
            {new Date(a.detected_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
          </div>
          {a.explanation && (
            <div style={{ color: '#ccc', fontSize: '13px', marginTop: '8px' }}>
              {a.explanation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnomalyPanel;
