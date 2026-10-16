import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  HardDrive, 
  Download, 
  Upload, 
  Trash2, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { dbService, STORES } from '../database/db';
import { ollamaService } from '../services/ollama';
import { formatBytes } from '../utils/helpers';

export default function SettingsPage({ theme, onToggleTheme, isOnline, swRegistered, cacheReady, cacheName, onRecheckCache }) {
  const [storageStats, setStorageStats] = useState({ usage: 0, quota: 0, percentage: 0 });
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [ollamaTestResult, setOllamaTestResult] = useState('');
  const [testingOllama, setTestingOllama] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    loadSettingsData();
  }, []);

  async function loadSettingsData() {
    const stats = await dbService.getStorageStats();
    setStorageStats(stats);

    const savedUrl = await dbService.getSetting('ollama_url', 'http://127.0.0.1:11434');
    setOllamaUrl(savedUrl);
  }

  // Backup all data
  async function handleExportBackup() {
    try {
      const backup = await dbService.exportAllData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offlineweb_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg('Full offline backup downloaded successfully!');
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  }

  // Restore backup
  async function handleImportBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Importing will merge/restore notes, documents, and settings. Continue?')) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        await dbService.importAllData(parsed);
        await loadSettingsData();
        setStatusMsg('Backup imported and merged into IndexedDB successfully!');
      } catch (err) {
        alert('Restore failed: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Clear data
  async function handleClearAllData() {
    if (!window.confirm('⚠️ WARNING: This will permanently delete all offline notes, saved documents, and bookmarks from IndexedDB! Are you sure?')) {
      return;
    }

    try {
      await Promise.all([
        dbService.clear(STORES.NOTES),
        dbService.clear(STORES.DOCUMENTS),
        dbService.clear(STORES.SAVED_KNOWLEDGE)
      ]);
      await loadSettingsData();
      setStatusMsg('All local user data has been cleared.');
    } catch (err) {
      alert('Failed clearing data: ' + err.message);
    }
  }

  // Test Ollama URL
  async function handleTestOllama() {
    setTestingOllama(true);
    setOllamaTestResult('');
    ollamaService.setBaseUrl(ollamaUrl);
    await dbService.setSetting('ollama_url', ollamaUrl);

    const res = await ollamaService.checkConnection();
    setTestingOllama(false);
    if (res.available) {
      setOllamaTestResult(`Connected! Detected ${res.models.length} model(s): ${res.models.join(', ') || 'None'}`);
    } else {
      setOllamaTestResult(`Connection failed: ${res.error}`);
    }
  }

  // Unregister & Refresh SW Cache
  async function handleClearCache() {
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
    }
    alert('Local caches cleared. The page will now reload to re-initialize the service worker.');
    window.location.reload();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <SettingsIcon size={22} color="var(--accent-cyan)" /> Settings & Diagnostics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          Manage local IndexedDB storage, system theme, service worker cache diagnostics, and Ollama configuration.
        </p>
      </div>

      {statusMsg && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {statusMsg}
        </div>
      )}

      {/* 1. Theme Configuration */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {theme === 'dark' ? <Moon size={18} color="var(--accent-cyan)" /> : <Sun size={18} color="#f59e0b" />} Appearance
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Color Palette</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Current: <strong>{theme === 'dark' ? 'Futuristic Dark Navy & Cyan' : 'High Contrast Light'}</strong>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>

      {/* 2. Offline Diagnostics & Service Worker Health */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color="var(--accent-cyan)" /> Offline Readiness Diagnostics
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Network Connectivity Status</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>navigator.onLine API</div>
            </div>
            <span className={`status-indicator-pill ${isOnline ? 'online' : 'offline'}`}>
              <span className={`dot ${isOnline ? 'online' : 'offline'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Service Worker Engine</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Background caching controller</div>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: swRegistered ? '#34d399' : '#fbbf24' }}>
              {swRegistered ? 'Registered & Controlling' : 'Not Active'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Cache Storage Integrity</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cache identifier: {cacheName}</div>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: cacheReady ? 'var(--accent-cyan)' : '#fbbf24' }}>
              {cacheReady ? 'Core Assets Pre-cached' : 'Cache Incomplete'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onRecheckCache}>
            <RotateCcw size={14} /> Re-verify Cache
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleClearCache}>
            <Trash2 size={14} /> Reset Service Worker & Caches
          </button>
        </div>
      </div>

      {/* 3. Local Data Management (Export / Import / Clear) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HardDrive size={18} color="var(--accent-cyan)" /> Local IndexedDB Data Management
        </h2>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
            <span>IndexedDB Usage: <strong>{formatBytes(storageStats.usage)}</strong></span>
            <span>Quota: <strong>{formatBytes(storageStats.quota)}</strong> ({storageStats.percentage}%)</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(storageStats.percentage, 2)}%`, height: '100%', background: 'var(--accent-cyan)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleExportBackup}>
            <Download size={16} /> Export Full JSON Backup
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Restore Backup JSON
            <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-danger" onClick={handleClearAllData}>
            <Trash2 size={16} /> Clear All Local Data
          </button>
        </div>
      </div>

      {/* 4. Local AI Configuration */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={18} color="var(--accent-cyan)" /> Local Ollama Endpoint
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Ollama Host Address (Localhost only)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field code-font"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434"
              />
              <button className="btn btn-primary" onClick={handleTestOllama} disabled={testingOllama}>
                {testingOllama ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Standard default port is 11434. Keep on localhost or 127.0.0.1.
            </div>
          </div>

          {ollamaTestResult && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              background: ollamaTestResult.includes('Connected') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: ollamaTestResult.includes('Connected') ? '#34d399' : '#f87171',
              border: `1px solid ${ollamaTestResult.includes('Connected') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              {ollamaTestResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
