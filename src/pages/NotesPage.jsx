import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Download, 
  Upload, 
  Tag, 
  Calendar, 
  FileText, 
  Check, 
  Clock,
  Sparkles,
  Eye,
  Edit3
} from 'lucide-react';
import { dbService, STORES } from '../database/db';
import { generateId, formatDate, renderSafeMarkdown } from '../utils/helpers';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [autoSaveStatus, setAutoSaveStatus] = useState('Saved');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const allNotes = await dbService.getAll(STORES.NOTES);
      allNotes.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      setNotes(allNotes);
      if (allNotes.length > 0 && !selectedNote) {
        setSelectedNote(allNotes[0]);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  }

  // Create new note
  function handleCreateNote() {
    const newNote = {
      id: generateId('note'),
      title: 'Untitled Note',
      content: '',
      tags: ['General'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    dbService.put(STORES.NOTES, newNote);
  }

  // Update note with debounce/auto-save
  async function handleUpdateNote(field, value) {
    if (!selectedNote) return;
    setAutoSaveStatus('Saving...');

    const updated = {
      ...selectedNote,
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    setSelectedNote(updated);
    setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));

    try {
      await dbService.put(STORES.NOTES, updated);
      setAutoSaveStatus('Saved locally');
    } catch (err) {
      setAutoSaveStatus('Error saving!');
      console.error(err);
    }
  }

  // Delete note
  async function handleDeleteNote(id) {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await dbService.delete(STORES.NOTES, id);
      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      setSelectedNote(remaining.length > 0 ? remaining[0] : null);
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  }

  // Export note to text file
  function handleExportTxt() {
    if (!selectedNote) return;
    const blob = new Blob([`${selectedNote.title}\n\n${selectedNote.content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export all notes as JSON
  function handleExportJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `offlineweb_notes_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }

  // Import notes from JSON
  async function handleImportJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          for (const item of imported) {
            if (item.title && typeof item.content === 'string') {
              const note = {
                ...item,
                id: item.id || generateId('note'),
                updatedAt: item.updatedAt || new Date().toISOString()
              };
              await dbService.put(STORES.NOTES, note);
            }
          }
          await loadNotes();
          alert(`Successfully imported ${imported.length} note(s)!`);
        } else {
          alert('Imported JSON is not an array of notes.');
        }
      } catch (err) {
        alert('Invalid JSON file format: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Extract all unique tags
  const allTags = ['all', ...new Set(notes.flatMap((n) => n.tags || []))];

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || (note.tags || []).includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      {/* Sidebar: Notes List */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Controls */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateNote}>
              <Plus size={16} /> New Note
            </button>
            <button className="btn btn-secondary btn-icon" title="Export all notes (JSON)" onClick={handleExportJson}>
              <Download size={16} />
            </button>
            <label className="btn btn-secondary btn-icon" title="Import notes (JSON)" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search notes locally..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.1rem' }}
            />
          </div>

          {/* Tag Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                style={{
                  padding: '0.2rem 0.55rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderColor: selectedTag === t ? 'var(--accent-cyan)' : 'var(--border-color)',
                  background: selectedTag === t ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  color: selectedTag === t ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* List of notes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {notes.length === 0 ? 'No notes yet. Click "New Note" to create one!' : 'No notes match your filter.'}
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(0, 229, 255, 0.08)' : 'var(--bg-input)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {note.title || 'Untitled Note'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxHeight: '2.4rem', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.4rem' }}>
                    {note.content || 'Empty note...'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    <span>{formatDate(note.updatedAt)}</span>
                    {(note.tags || []).length > 0 && (
                      <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {note.tags[0]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor & Viewer Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedNote ? (
          <>
            {/* Header controls */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} /> {autoSaveStatus}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>|</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedNote.content ? selectedNote.content.trim().split(/\s+/).filter(Boolean).length : 0} words
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={`btn btn-sm ${previewMode ? 'btn-neon' : 'btn-secondary'}`}
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                  {previewMode ? 'Edit Mode' : 'Markdown Preview'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleExportTxt} title="Export as plain text">
                  <Download size={14} /> Export TXT
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteNote(selectedNote.id)} title="Delete note">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            {/* Note Title & Tags */}
            <div style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Note Title"
                value={selectedNote.title || ''}
                onChange={(e) => handleUpdateNote('title', e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  outline: 'none',
                  width: '100%'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={14} color="var(--accent-cyan)" />
                <input
                  type="text"
                  placeholder="Tags separated by commas (e.g. Work, Research, Code)"
                  value={(selectedNote.tags || []).join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                    handleUpdateNote('tags', tags);
                  }}
                  className="input-field"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* Note Body */}
            <div style={{ flex: 1, padding: '0 1.5rem 1.5rem', overflowY: 'auto' }}>
              {previewMode ? (
                <div 
                  style={{ minHeight: '100%', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}
                  dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(selectedNote.content) }}
                />
              ) : (
                <textarea
                  className="textarea-field"
                  placeholder="Write your note here using Markdown or plain text..."
                  value={selectedNote.content || ''}
                  onChange={(e) => handleUpdateNote('content', e.target.value)}
                  style={{
                    width: '100%',
                    height: '100%',
                    resize: 'none',
                    border: 'none',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    lineHeight: 1.6
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Note Selected</div>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Select a note from the left or create a new one.</p>
            <button className="btn btn-primary" style={{ marginTop: '1.25rem' }} onClick={handleCreateNote}>
              <Plus size={16} /> Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
