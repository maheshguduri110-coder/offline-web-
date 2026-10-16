import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  Trash2, 
  FileCode, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  HardDrive,
  Download,
  Eye,
  Info
} from 'lucide-react';
import { dbService, STORES } from '../database/db';
import { generateId, formatDate, formatBytes, getHighlightedExcerpt, renderSafeMarkdown } from '../utils/helpers';

const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.json', '.csv', '.js', '.ts', '.html', '.css', '.py', '.sql', '.yaml', '.yml'];

export default function DocumentLibraryPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const allDocs = await dbService.getAll(STORES.DOCUMENTS);
      allDocs.sort((a, b) => new Date(b.importedAt || 0) - new Date(a.importedAt || 0));
      setDocuments(allDocs);
      if (allDocs.length > 0 && !selectedDoc) {
        setSelectedDoc(allDocs[0]);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  }

  // Handle local file selection / import
  async function handleFileImport(files) {
    if (!files || files.length === 0) return;
    setErrorMessage('');
    let importedCount = 0;
    let unsupportedFiles = [];

    for (const file of Array.from(files)) {
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      
      // Validation check
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        unsupportedFiles.push(file.name);
        continue;
      }

      try {
        const content = await file.text();
        const newDoc = {
          id: generateId('doc'),
          name: file.name,
          type: ext.replace('.', ''),
          size: file.size,
          content: content,
          importedAt: new Date().toISOString()
        };

        await dbService.put(STORES.DOCUMENTS, newDoc);
        importedCount++;
      } catch (err) {
        console.error('Failed reading file:', file.name, err);
      }
    }

    if (unsupportedFiles.length > 0) {
      setErrorMessage(
        `Note: Skipped ${unsupportedFiles.length} unsupported file(s) (${unsupportedFiles.slice(0, 3).join(', ')}${unsupportedFiles.length > 3 ? '...' : ''}). Supported offline formats: Markdown, Plain Text, JSON, CSV, and code files.`
      );
    }

    if (importedCount > 0) {
      await loadDocuments();
    }
  }

  // Delete document
  async function handleDelete(id) {
    if (!window.confirm('Delete this document from local offline storage?')) return;
    try {
      await dbService.delete(STORES.DOCUMENTS, id);
      const remaining = documents.filter((d) => d.id !== id);
      setDocuments(remaining);
      setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
    } catch (err) {
      console.error('Failed to delete doc:', err);
    }
  }

  // Export doc
  function handleDownloadDoc(doc) {
    if (!doc) return;
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filter documents and match query in content
  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      (doc.content || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      {/* Sidebar: Documents list & upload area */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Upload & Dropzone */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileImport(e.dataTransfer.files);
            }}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1rem',
              textAlign: 'center',
              background: isDragging ? 'rgba(0, 229, 255, 0.08)' : 'var(--bg-input)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={22} color="var(--accent-cyan)" style={{ marginBottom: '0.35rem' }} />
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Drop files here or click to import</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              .md, .txt, .json, .csv, source files
            </div>
            <label style={{ display: 'block', marginTop: '0.5rem' }}>
              <span className="btn btn-secondary btn-sm">Choose Files</span>
              <input
                type="file"
                multiple
                accept=".md,.txt,.json,.csv,.js,.ts,.html,.css,.py,.sql,.yaml,.yml"
                onChange={(e) => handleFileImport(e.target.files)}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search document names & text..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.1rem' }}
            />
          </div>

          {errorMessage && (
            <div style={{ fontSize: '0.775rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '6px', display: 'flex', gap: '0.4rem' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMessage}</div>
            </div>
          )}
        </div>

        {/* Document List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {documents.length === 0 ? 'No documents stored. Drop local files above to build your offline library!' : 'No documents matched your query.'}
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              const excerpt = getHighlightedExcerpt(doc.content, searchQuery, 90);
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <FileText size={16} color="var(--accent-cyan)" />
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)' }}>
                      {doc.name}
                    </div>
                  </div>

                  {searchQuery && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.5rem', borderRadius: '4px', margin: '0.35rem 0' }}>
                      {excerpt}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <span>{formatBytes(doc.size)}</span>
                    <span>{formatDate(doc.importedAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Document Viewer */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedDoc ? (
          <>
            {/* Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCode size={20} color="var(--accent-cyan)" />
                  {selectedDoc.name}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Size: {formatBytes(selectedDoc.size)} | Format: {selectedDoc.type.toUpperCase()} | Imported: {formatDate(selectedDoc.importedAt)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadDoc(selectedDoc)}>
                  <Download size={14} /> Download
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selectedDoc.id)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
              {selectedDoc.type === 'md' ? (
                <div 
                  style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}
                  dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(selectedDoc.content) }}
                />
              ) : (
                <pre 
                  className="code-font"
                  style={{ 
                    background: 'var(--bg-input)', 
                    padding: '1.25rem', 
                    borderRadius: 'var(--radius-md)', 
                    color: 'var(--text-main)', 
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowX: 'auto'
                  }}
                >
                  {selectedDoc.content}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <FolderSearch size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Offline Document Library</div>
            <p style={{ fontSize: '0.9rem', marginTop: '0.25rem', maxWidth: '400px', textAlign: 'center' }}>
              Import local files into IndexedDB so they are fully indexed, searchable, and readable even when disconnected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
