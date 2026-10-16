import React, { useState } from 'react';
import { 
  Wrench, 
  Type, 
  FileDiff, 
  Braces, 
  Clock, 
  Calculator, 
  Check, 
  Copy, 
  AlertCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { computeTextDiff } from '../utils/helpers';

export default function OfflineToolsPage() {
  const [activeTab, setActiveTab] = useState('word-counter');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Tool Switcher */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={20} color="var(--accent-cyan)" /> Offline Developer & Student Tools
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            All operations run 100% locally in your browser JavaScript thread. Zero network packets sent.
          </p>
        </div>

        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${activeTab === 'word-counter' ? 'btn-neon' : 'btn-secondary'}`}
            onClick={() => setActiveTab('word-counter')}
          >
            <Type size={14} /> Word & Character Counter
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'text-diff' ? 'btn-neon' : 'btn-secondary'}`}
            onClick={() => setActiveTab('text-diff')}
          >
            <FileDiff size={14} /> Text Comparison (Diff)
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'json-tools' ? 'btn-neon' : 'btn-secondary'}`}
            onClick={() => setActiveTab('json-tools')}
          >
            <Braces size={14} /> JSON Formatter & Validator
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'timestamp-calc' ? 'btn-neon' : 'btn-secondary'}`}
            onClick={() => setActiveTab('timestamp-calc')}
          >
            <Clock size={14} /> Timestamp & Epoch
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'calculator' ? 'btn-neon' : 'btn-secondary'}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={14} /> Quick Calculator
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'word-counter' && <WordCounterTool />}
      {activeTab === 'text-diff' && <TextDiffTool />}
      {activeTab === 'json-tools' && <JsonFormatterTool />}
      {activeTab === 'timestamp-calc' && <TimestampTool />}
      {activeTab === 'calculator' && <QuickCalculatorTool />}
    </div>
  );
}

// 1. Word and Character Counter
function WordCounterTool() {
  const [text, setText] = useState('');

  const charCountWithSpaces = text.length;
  const charCountNoSpaces = text.replace(/\s+/g, '').length;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const lineCount = text ? text.split('\n').length : 0;
  const readingTimeMinutes = Math.ceil(wordCount / 200);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="grid-4">
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Words</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{wordCount}</div>
        </div>
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Characters (with spaces)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{charCountWithSpaces}</div>
        </div>
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Characters (no spaces)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{charCountNoSpaces}</div>
        </div>
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. Reading Time</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>{readingTimeMinutes} min</div>
        </div>
      </div>

      <textarea
        className="textarea-field"
        rows={10}
        placeholder="Type or paste text here to inspect word count, characters, reading speed, and line statistics..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setText('')}>
          <RotateCcw size={14} /> Clear Text
        </button>
      </div>
    </div>
  );
}

// 2. Text Comparison Diff Tool
function TextDiffTool() {
  const [original, setOriginal] = useState('{\n  "offline": true,\n  "version": 1\n}');
  const [modified, setModified] = useState('{\n  "offline": true,\n  "version": 2,\n  "turboMode": true\n}');
  const [diffResult, setDiffResult] = useState([]);

  function runDiff() {
    const diff = computeTextDiff(original, modified);
    setDiffResult(diff);
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="grid-2">
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem' }}>Original Text</label>
          <textarea
            className="textarea-field code-font"
            rows={8}
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem' }}>Modified Text</label>
          <textarea
            className="textarea-field code-font"
            rows={8}
            value={modified}
            onChange={(e) => setModified(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={runDiff}>
          <FileDiff size={16} /> Compute Comparison Diff
        </button>
      </div>

      {diffResult.length > 0 && (
        <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxHeight: '340px', overflowY: 'auto' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            Diff Output (Line by line)
          </div>
          <div className="code-font" style={{ fontSize: '0.825rem' }}>
            {diffResult.map((d, index) => {
              const bg = d.type === 'added' ? 'rgba(16, 185, 129, 0.15)' : d.type === 'removed' ? 'rgba(239, 68, 68, 0.15)' : 'transparent';
              const color = d.type === 'added' ? '#34d399' : d.type === 'removed' ? '#f87171' : 'var(--text-main)';
              const prefix = d.type === 'added' ? '+ ' : d.type === 'removed' ? '- ' : '  ';

              return (
                <div key={index} style={{ background: bg, color: color, padding: '0.2rem 0.5rem', display: 'flex', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', width: '30px', textAlign: 'right' }}>{d.lineNum}</span>
                  <span>{prefix}{d.line}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 3. JSON Formatter and Validator
function JsonFormatterTool() {
  const [inputJson, setInputJson] = useState('{"name":"OfflineWeb AI","status":"offline-ready","features":["notes","docs","tools"]}');
  const [outputJson, setOutputJson] = useState('');
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [copied, setCopied] = useState(false);

  function formatJson(indent = 2) {
    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, indent);
      setOutputJson(formatted);
      setStatus({ type: 'success', msg: 'Valid JSON formatted successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: `JSON Syntax Error: ${err.message}` });
    }
  }

  function minifyJson() {
    try {
      const parsed = JSON.parse(inputJson);
      setOutputJson(JSON.stringify(parsed));
      setStatus({ type: 'success', msg: 'JSON minified successfully.' });
    } catch (err) {
      setStatus({ type: 'error', msg: `JSON Syntax Error: ${err.message}` });
    }
  }

  function copyOutput() {
    if (!outputJson) return;
    navigator.clipboard.writeText(outputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="grid-2">
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.4rem' }}>Raw / Messy JSON</label>
          <textarea
            className="textarea-field code-font"
            rows={10}
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder="Paste your JSON string here..."
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.825rem', fontWeight: 600 }}>Formatted JSON Output</label>
            {outputJson && (
              <button className="btn btn-secondary btn-sm" onClick={copyOutput}>
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <textarea
            className="textarea-field code-font"
            rows={10}
            readOnly
            value={outputJson}
            placeholder="Formatted output will appear here..."
            style={{ background: 'var(--bg-input)' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => formatJson(2)}>
            Format (2 Spaces)
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => formatJson(4)}>
            Format (4 Spaces)
          </button>
          <button className="btn btn-secondary btn-sm" onClick={minifyJson}>
            Minify Compact
          </button>
        </div>

        {status.msg && (
          <div style={{
            fontSize: '0.825rem',
            color: status.type === 'success' ? '#34d399' : '#f87171',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {status.msg}
          </div>
        )}
      </div>
    </div>
  );
}

// 4. Timestamp and Epoch Tool
function TimestampTool() {
  const [currentEpoch, setCurrentEpoch] = useState(Math.floor(Date.now() / 1000));
  const [inputEpoch, setInputEpoch] = useState(Math.floor(Date.now() / 1000).toString());
  const [convertedDate, setConvertedDate] = useState('');

  function handleConvert() {
    try {
      const num = Number(inputEpoch);
      const isMillis = num > 100000000000;
      const d = new Date(isMillis ? num : num * 1000);
      setConvertedDate(d.toUTCString() + ' | Local: ' + d.toLocaleString());
    } catch {
      setConvertedDate('Invalid timestamp');
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Unix Epoch Timestamp (Seconds)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyan)' }} className="code-font">
            {Math.floor(Date.now() / 1000)}
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(Math.floor(Date.now() / 1000).toString())}>
          <Copy size={14} /> Copy Current
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>Convert Unix Timestamp</label>
          <input
            type="number"
            className="input-field code-font"
            value={inputEpoch}
            onChange={(e) => setInputEpoch(e.target.value)}
            placeholder="Epoch timestamp..."
          />
        </div>
        <button className="btn btn-primary" onClick={handleConvert}>
          Convert to Human Date
        </button>
      </div>

      {convertedDate && (
        <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--accent-cyan)' }}>Converted Time:</strong> {convertedDate}
        </div>
      )}
    </div>
  );
}

// 5. Basic Calculator
function QuickCalculatorTool() {
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');

  function handleCalculate() {
    try {
      // Safe sanitized eval for math expression
      if (!/^[0-9+\-*/().\s^%]+$/.test(calcInput)) {
        setCalcResult('Invalid characters in expression');
        return;
      }
      // eslint-disable-next-line no-new-func
      const res = Function(`"use strict"; return (${calcInput.replace(/\^/g, '**')})`)();
      setCalcResult(String(res));
    } catch (err) {
      setCalcResult('Calculation Error');
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.35rem' }}>Expression</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="input-field code-font"
            placeholder="e.g. (1024 * 8) / 100 or 2^10"
            value={calcInput}
            onChange={(e) => setCalcInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
          />
          <button className="btn btn-primary" onClick={handleCalculate}>
            =
          </button>
        </div>
      </div>

      {calcResult && (
        <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Result</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }} className="code-font">
            {calcResult}
          </div>
        </div>
      )}
    </div>
  );
}
