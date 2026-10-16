import React, { useState, useEffect } from 'react';
import { 
  Home, 
  FileText, 
  FolderSearch, 
  Bookmark, 
  Wrench, 
  Bot, 
  Settings, 
  Wifi, 
  WifiOff, 
  Moon, 
  Sun,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { useOnlineStatus } from './services/useOnlineStatus';
import { dbService } from './database/db';

// Pages
import HomeDashboard from './pages/HomeDashboard';
import NotesPage from './pages/NotesPage';
import DocumentLibraryPage from './pages/DocumentLibraryPage';
import SavedKnowledgePage from './pages/SavedKnowledgePage';
import OfflineToolsPage from './pages/OfflineToolsPage';
import LocalAiPage from './pages/LocalAiPage';
import SettingsPage from './pages/SettingsPage';
import OfflineFallbackView from './components/OfflineFallbackView';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [theme, setTheme] = useState('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isOnline, swRegistered, cacheReady, cacheName, recheckCache } = useOnlineStatus();

  // Load saved theme preference
  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await dbService.getSetting('theme', 'dark');
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    loadTheme();
  }, []);

  // Toggle theme
  async function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    await dbService.setSetting('theme', nextTheme);
  }

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'notes', label: 'Notes Vault', icon: FileText },
    { id: 'documents', label: 'Doc Library', icon: FolderSearch },
    { id: 'knowledge', label: 'Saved Knowledge', icon: Bookmark },
    { id: 'tools', label: 'Offline Tools', icon: Wrench },
    { id: 'ai', label: 'Local AI Assistant', icon: Bot },
    { id: 'settings', label: 'Settings & Cache', icon: Settings }
  ];

  function renderPage() {
    switch (currentPage) {
      case 'home':
        return (
          <HomeDashboard
            onNavigate={(page) => setCurrentPage(page)}
            isOnline={isOnline}
            swRegistered={swRegistered}
            cacheReady={cacheReady}
          />
        );
      case 'notes':
        return <NotesPage />;
      case 'documents':
        return <DocumentLibraryPage />;
      case 'knowledge':
        return <SavedKnowledgePage />;
      case 'tools':
        return <OfflineToolsPage />;
      case 'ai':
        return <LocalAiPage />;
      case 'settings':
        return (
          <SettingsPage
            theme={theme}
            onToggleTheme={toggleTheme}
            isOnline={isOnline}
            swRegistered={swRegistered}
            cacheReady={cacheReady}
            cacheName={cacheName}
            onRecheckCache={recheckCache}
          />
        );
      case 'offline-fallback':
        return (
          <OfflineFallbackView
            onGoHome={() => setCurrentPage('home')}
            onRetry={() => window.location.reload()}
          />
        );
      default:
        return (
          <HomeDashboard
            onNavigate={(page) => setCurrentPage(page)}
            isOnline={isOnline}
            swRegistered={swRegistered}
            cacheReady={cacheReady}
          />
        );
    }
  }

  return (
    <div className="app-layout">
      {/* Sidebar navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="brand-section">
          <div className="brand-logo">
            ⚡
          </div>
          <div>
            <div className="brand-title">OfflineWeb AI</div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Self-Reliant Client</div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div style={{ padding: '0 0.5rem 1rem' }}>
          <div className={`status-indicator-pill ${isOnline ? 'online' : 'offline'}`} style={{ width: '100%', justifyContent: 'center' }}>
            <span className={`dot ${isOnline ? 'online' : 'offline'}`} />
            {isOnline ? 'Online (Ready)' : 'Offline (Local Only)'}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="nav-menu">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom footer in sidebar */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>IndexedDB: Sandboxed</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navbar */}
        <header className="top-bar">
          <div className="top-bar-title">
            <span style={{ color: 'var(--accent-cyan)' }}>//</span>
            <span>
              {navItems.find((n) => n.id === currentPage)?.label || 'Dashboard'}
            </span>
          </div>

          <div className="top-bar-actions">
            <div className={`status-indicator-pill ${isOnline ? 'online' : 'offline'}`}>
              <span className={`dot ${isOnline ? 'online' : 'offline'}`} />
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            <button 
              className="btn btn-secondary btn-icon"
              onClick={toggleTheme}
              title="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Dynamic page content */}
        <div className="content-body">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
