/**
 * Safe local utilities for text processing, search, formatting, and sanitation.
 * ZERO external dependencies, pure in-browser functionality.
 */

// Escape HTML to prevent XSS injection in raw content rendering
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format file size
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format date nicely
export function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

// Generate unique local ID
export function generateId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Lightweight Markdown to HTML renderer (zero remote deps, safe tags only)
export function renderSafeMarkdown(md) {
  if (!md) return '';
  let safe = escapeHtml(md);

  // Headers
  safe = safe.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  safe = safe.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  safe = safe.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // Bold & Italic
  safe = safe.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  safe = safe.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  safe = safe.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  safe = safe.replace(/`([^`]+)`/gim, '<code class="md-code">$1</code>');

  // Blockquotes
  safe = safe.replace(/^\> (.*$)/gim, '<blockquote class="md-quote">$1</blockquote>');

  // Unordered list
  safe = safe.replace(/^\- (.*$)/gim, '<li class="md-li">$1</li>');

  // Paragraphs & Linebreaks
  safe = safe.replace(/\n\n+/g, '</p><p class="md-p">');
  safe = safe.replace(/\n/g, '<br/>');

  return `<p class="md-p">${safe}</p>`;
}

// Highlight matching search words in an excerpt
export function getHighlightedExcerpt(content, query, maxLength = 160) {
  if (!content) return '';
  if (!query || !query.trim()) {
    return content.length > maxLength ? content.slice(0, maxLength) + '...' : content;
  }

  const cleanQuery = query.trim().toLowerCase();
  const lowerContent = content.toLowerCase();
  const matchIndex = lowerContent.indexOf(cleanQuery);

  let start = 0;
  if (matchIndex > -1) {
    start = Math.max(0, matchIndex - Math.floor(maxLength / 3));
  }
  
  let excerpt = content.slice(start, start + maxLength);
  if (start > 0) excerpt = '...' + excerpt;
  if (start + maxLength < content.length) excerpt += '...';

  return excerpt;
}

// Text diff algorithm (line by line simple comparison)
export function computeTextDiff(original, modified) {
  const origLines = (original || '').split('\n');
  const modLines = (modified || '').split('\n');
  const max = Math.max(origLines.length, modLines.length);
  const diff = [];

  for (let i = 0; i < max; i++) {
    const o = origLines[i];
    const m = modLines[i];

    if (o === undefined) {
      diff.push({ type: 'added', line: m, lineNum: i + 1 });
    } else if (m === undefined) {
      diff.push({ type: 'removed', line: o, lineNum: i + 1 });
    } else if (o === m) {
      diff.push({ type: 'unchanged', line: o, lineNum: i + 1 });
    } else {
      diff.push({ type: 'removed', line: o, lineNum: i + 1 });
      diff.push({ type: 'added', line: m, lineNum: i + 1 });
    }
  }

  return diff;
}
