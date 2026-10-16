import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  ExternalLink, 
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { dbService, STORES } from '../database/db';
import { generateId, formatDate } from '../utils/helpers';

const DEFAULT_CATEGORIES = ['Reference', 'Cheatsheet', 'Algorithm', 'Web API', 'DevOps', 'Personal'];

export default function SavedKnowledgePage() {
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Reference');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    loadKnowledge();
  }, []);

  async function loadKnowledge() {
    try {
      const items = await dbService.getAll(STORES.SAVED_KNOWLEDGE);
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setKnowledgeList(items);
    } catch (err) {
      console.error('Failed to load knowledge:', err);
    }
  }

  async function handleAddEntry(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagsArray = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const item = {
      id: generateId('know'),
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      tags: tagsArray,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.put(STORES.SAVED_KNOWLEDGE, item);
      setKnowledgeList([item, ...knowledgeList]);
      setShowAddModal(false);
      setNewTitle('');
      setNewContent('');
      setNewTags('');
    } catch (err) {
      alert('Error saving knowledge item: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this saved knowledge item?')) return;
    try {
      await dbService.delete(STORES.SAVED_KNOWLEDGE, id);
      setKnowledgeList(knowledgeList.filter((k) => k.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  function handleCopy(id, text) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Filter items
  const filteredItems = knowledgeList.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      (item.title || '').toLowerCase().includes(q) ||
      (item.content || '').toLowerCase().includes(q) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top action bar */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bookmark size={20} color="var(--accent-cyan)" /> Saved Knowledge & Cheatsheets
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Curate offline reference snippets, API guides, and code snippets stored securely in IndexedDB.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Bookmark New Knowledge
        </button>
      </div>

      {/* Filter and Search controls */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search saved bookmarks, snippets, or tags..."
            className="input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.1rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {['All', ...DEFAULT_CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--accent-cyan)' : 'var(--border-color)',
                background: selectedCategory === cat ? 'rgba(0, 229, 255, 0.12)' : 'var(--bg-input)',
                color: selectedCategory === cat ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: selectedCategory === cat ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Knowledge Cards */}
      {filteredItems.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          {knowledgeList.length === 0
            ? 'No saved knowledge items yet. Add cheat sheets and reference materials to access them offline!'
            : 'No items match your category and search criteria.'}
        </div>
      ) : (
        <div className="grid-2">
          {filteredItems.map((item) => (
            <div key={item.id} className="glass-panel neon-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px',
                    background: 'rgba(0, 229, 255, 0.12)',
                    color: 'var(--accent-cyan)',
                    letterSpacing: '0.04em'
                  }}>
                    {item.category}
                  </span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.45rem' }}>
                    {item.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    className="btn btn-secondary btn-icon btn-sm" 
                    title="Copy content to clipboard"
                    onClick={() => handleCopy(item.id, item.content)}
                  >
                    {copiedId === item.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                  <button 
                    className="btn btn-danger btn-icon btn-sm" 
                    title="Delete item"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Content box */}
              <pre
                className="code-font"
                style={{
                  background: 'var(--bg-input)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.825rem',
                  lineHeight: 1.5,
                  flex: 1,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  marginBottom: '0.75rem'
                }}
              >
                {item.content}
              </pre>

              {/* Tags & Date Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {(item.tags || []).map((t, idx) => (
                    <span key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                      #{t}
                    </span>
                  ))}
                </div>
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Knowledge Item */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '1.75rem', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Bookmark New Knowledge
            </h3>

            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Git Branching Offline Cheatsheet or Docker CLI Guide"
                  className="input-field"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                <select
                  className="select-field"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>Content / Code Snippet</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Paste snippets, reference commands, notes, or tips..."
                  className="textarea-field code-font"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. git, dev, offline"
                  className="input-field"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to IndexedDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
