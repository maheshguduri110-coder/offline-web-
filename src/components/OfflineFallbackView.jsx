import React from 'react';
import { WifiOff, Home, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function OfflineFallbackView({ onRetry, onGoHome }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '65vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div 
        className="glass-panel" 
        style={{
          maxWidth: '560px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <WifiOff size={32} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          You Are Currently Offline
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          The requested route or external resource is not present in your local offline cache.
          Never fear: your local offline workspace and all saved records in 
          <strong> IndexedDB</strong> remain safe and accessible.
        </p>

        <div style={{
          background: 'var(--bg-input)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          textAlign: 'left',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            <ShieldCheck size={16} /> Offline Capabilities Intact:
          </div>
          <div>✓ Access all previously created notes</div>
          <div>✓ Search imported local documents</div>
          <div>✓ Use offline text & developer tools</div>
          <div>✓ Run queries on local Ollama AI models</div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-primary" onClick={onGoHome}>
            <Home size={16} /> Return to Dashboard
          </button>
          <button className="btn btn-secondary" onClick={onRetry}>
            <RotateCcw size={16} /> Retry Route
          </button>
        </div>
      </div>
    </div>
  );
}
