import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  HardDrive, 
  FileText, 
  Bookmark, 
  FolderSearch, 
  Bot, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock,
  Sparkles,
  Zap,
  Layers
} from 'lucide-react';
import { dbService, STORES } from '../database/db';
import { formatBytes, formatDate } from '../utils/helpers';

export default function HomeDashboard({ onNavigate, isOnline, swRegistered, cacheReady }) {
  const [stats, setStats] = useState({
    notesCount: 0,
    docsCount: 0,
    knowledgeCount: 0,
    storageUsage: 0,
    storageQuota: 0,
    storagePercent: 0,
    recentItems: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [notes, docs, knowledge, storage] = await Promise.all([
        dbService.getAll(STORES.NOTES),
        dbService.getAll(STORES.DOCUMENTS),
        dbService.getAll(STORES.SAVED_KNOWLEDGE),
        dbService.getStorageStats()
      ]);

      // Combine and get recent items
      const recent = [
        ...notes.map((n) => ({ id: n.id, title: n.title, type: 'note', date: n.updatedAt, page: 'notes' })),
        ...docs.map((d) => ({ id: d.id, title: d.name, type: 'document', date: d.importedAt, page: 'documents' })),
        ...knowledge.map((k) => ({ id: k.id, title: k.title, type: 'knowledge', date: k.createdAt, page: 'knowledge' }))
      ]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 5);

      setStats({
        notesCount: notes.length,
        docsCount: docs.length,
        knowledgeCount: knowledge.length,
        storageUsage: storage.usage,
        storageQuota: storage.quota,
        storagePercent: storage.percentage,
        recentItems: recent
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div 
        className="glass-panel neon-card pulse-border" 
        style={{ 
          padding: '2rem', 
          background: 'linear-gradient(135deg, rgba(14, 27, 49, 0.85) 0%, rgba(9, 14, 26, 0.95) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ 
              background: 'rgba(0, 229, 255, 0.15)', 
              color: 'var(--accent-cyan)', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Zap size={13} /> 100% Client-Side Engine
            </span>
            <span style={{ 
              background: 'rgba(37, 99, 235, 0.15)', 
              color: '#60a5fa', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              v1.0.0 Stable
            </span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
            Welcome to <span style={{ color: 'var(--accent-cyan)' }}>OfflineWeb AI</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', fontSize: '0.975rem' }}>
            Your self-reliant knowledge workspace. Read docs, capture ideas, format data, 
            and query offline models even when completely severed from the internet.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem' }}>
          <button 
            className="btn btn-neon"
            onClick={() => onNavigate('notes')}
          >
            <FileText size={16} /> New Note
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('ai')}
          >
            <Bot size={16} /> Offline AI Assistant
          </button>
        </div>
      </div>

      {/* Offline Status & Readiness Cards */}
      <div className="grid-3">
        {/* Network & Cache Status */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Live Network State
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {isOnline ? 'Online (Connected)' : 'Offline (Self-Reliant)'}
              </div>
            </div>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isOnline ? '#10b981' : '#f59e0b'
            }}>
              {isOnline ? <Wifi size={22} /> : <WifiOff size={22} />}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span className={`dot ${isOnline ? 'online' : 'offline'}`}></span>
            {isOnline 
              ? 'External networks reachable, caching active.' 
              : 'Zero external requests. Operating from local cache.'}
          </div>
        </div>

        {/* Offline Readiness Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', textTransform: 'uppercase', fontWeight: 600 }}>
                Service Worker & Cache
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--accent-cyan)' }}>
                {cacheReady ? 'Offline Ready' : (swRegistered ? 'Active (Pre-cached)' : 'Installing Cache')}
              </div>
            </div>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(0, 229, 255, 0.15)',
              color: 'var(--accent-cyan)'
            }}>
              <ShieldCheck size={22} />
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Assets & Fallback routes cached in local storage.</span>
          </div>
        </div>

        {/* IndexedDB Local Storage Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', textTransform: 'uppercase', fontWeight: 600 }}>
                IndexedDB Storage
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.25rem' }}>
                {formatBytes(stats.storageUsage)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>used</span>
              </div>
            </div>
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa'
            }}>
              <HardDrive size={22} />
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${Math.max(stats.storagePercent, 2)}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))' 
              }} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>Available: {stats.storageQuota ? formatBytes(stats.storageQuota) : 'Local Sandbox'}</span>
            <span>{stats.storagePercent}%</span>
          </div>
        </div>
      </div>

      {/* Quick Access Modules */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-cyan)" /> Quick Access Modules
          </h2>
        </div>

        <div className="grid-4">
          <div 
            className="glass-panel" 
            style={{ padding: '1.35rem', cursor: 'pointer' }}
            onClick={() => onNavigate('notes')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)' }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Notes Vault</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.notesCount} records stored</div>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Create, tag, search and auto-save notes locally. Export to JSON/Text.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600 }}>
              Open Notes <ArrowRight size={14} />
            </div>
          </div>

          <div 
            className="glass-panel" 
            style={{ padding: '1.35rem', cursor: 'pointer' }}
            onClick={() => onNavigate('documents')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                <FolderSearch size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Doc Library</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.docsCount} documents</div>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Import local Markdown & text files. Instant offline search and excerpts.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>
              Search Library <ArrowRight size={14} />
            </div>
          </div>

          <div 
            className="glass-panel" 
            style={{ padding: '1.35rem', cursor: 'pointer' }}
            onClick={() => onNavigate('knowledge')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
                <Bookmark size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Knowledge Base</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.knowledgeCount} bookmarks</div>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Save code snippets, cheat sheets, and categorized offline reference guides.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24', fontSize: '0.8rem', fontWeight: 600 }}>
              Explore Bookmarks <ArrowRight size={14} />
            </div>
          </div>

          <div 
            className="glass-panel" 
            style={{ padding: '1.35rem', cursor: 'pointer' }}
            onClick={() => onNavigate('tools')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Offline Tools</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>5 client utilities</div>
              </div>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Word counter, text diff checker, JSON validator, formatter and calculator.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600 }}>
              Launch Tools <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Recently Saved Content Feed */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={18} color="var(--accent-cyan)" /> Recently Saved Content
        </h2>

        {stats.recentItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            No saved records yet. Create a note, bookmark text, or import a Markdown file to start!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.recentItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => onNavigate(item.page)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px',
                    background: item.type === 'note' ? 'rgba(0, 229, 255, 0.15)' : item.type === 'document' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: item.type === 'note' ? 'var(--accent-cyan)' : item.type === 'document' ? '#34d399' : '#fbbf24'
                  }}>
                    {item.type}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{item.title || 'Untitled'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {formatDate(item.date)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
