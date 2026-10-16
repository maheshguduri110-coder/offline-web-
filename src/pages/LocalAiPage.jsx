import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Cpu, 
  HelpCircle, 
  ServerOff, 
  Terminal,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { ollamaService } from '../services/ollama';

export default function LocalAiPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your Offline Local AI Assistant. I operate 100% locally via Ollama on your machine without contacting any remote cloud server. How can I help you today?'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState({
    checking: true,
    available: false,
    models: [],
    error: null
  });
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    checkOllama();
  }, []);

  async function checkOllama() {
    setOllamaStatus((prev) => ({ ...prev, checking: true }));
    const status = await ollamaService.checkConnection();
    setOllamaStatus({
      checking: false,
      available: status.available,
      models: status.models,
      error: status.error
    });

    if (status.models.length > 0 && !selectedModel) {
      setSelectedModel(status.models[0]);
    }
  }

  async function handleSend(e) {
    e?.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    if (!ollamaStatus.available) {
      alert('Local Ollama instance is not running on localhost:11434.');
      return;
    }

    if (!selectedModel) {
      alert('Please select an installed local model from the dropdown first.');
      return;
    }

    const userMessage = { role: 'user', content: inputPrompt.trim() };
    const tempAssistantMessage = { role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMessage, tempAssistantMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      await ollamaService.generate({
        model: selectedModel,
        prompt: userMessage.content,
        onChunk: (chunk, fullText) => {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: 'assistant', content: fullText };
            return copy;
          });
        }
      });
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { 
          role: 'assistant', 
          content: `⚠️ Local Generation Error: ${err.message}. Never falling back to external cloud AI.` 
        };
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
      {/* Sidebar: Service Status & Setup instructions */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Ollama Daemon
            </span>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={checkOllama} title="Refresh connection test">
              <RefreshCw size={12} className={ollamaStatus.checking ? 'spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span className={`dot ${ollamaStatus.available ? 'online' : 'offline'}`} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {ollamaStatus.checking
                ? 'Testing 127.0.0.1...'
                : ollamaStatus.available
                ? 'Local Service Active'
                : 'Service Unavailable'}
            </span>
          </div>
        </div>

        {/* Model Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Local Model
          </label>
          {ollamaStatus.available && ollamaStatus.models.length > 0 ? (
            <select
              className="select-field"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {ollamaStatus.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
              {ollamaStatus.available ? 'No models installed in Ollama' : 'No connection to Ollama'}
            </div>
          )}
        </div>

        {/* Strict Offline Security Guarantee */}
        <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.825rem' }}>
            <ShieldAlert size={15} /> Zero Cloud Fallback
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            This application will <strong>never</strong> silently route queries to OpenAI, Google, Anthropic, or any cloud API. All inference runs strictly on your machine.
          </p>
        </div>

        {/* Setup Guide if Ollama is not detected */}
        {!ollamaStatus.available && (
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 600, fontSize: '0.825rem', marginBottom: '0.35rem' }}>
              <ServerOff size={15} /> How to Run Ollama
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              To use offline local AI, install Ollama and run a model:
            </p>
            <ol style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li>Install from <code className="code-font" style={{ color: 'var(--accent-cyan)' }}>ollama.com</code></li>
              <li>Open terminal and run:
                <pre className="code-font" style={{ background: '#000', padding: '0.3rem', borderRadius: '4px', margin: '0.2rem 0' }}>ollama run llama3.2</pre>
              </li>
              <li>Click the refresh button above.</li>
            </ol>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              *Note: The rest of OfflineWeb AI works 100% offline without Ollama installed.
            </p>
          </div>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages feed */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {!isUser && (
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0, 229, 255, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={18} />
                  </div>
                )}

                <div
                  style={{
                    background: isUser ? 'linear-gradient(135deg, var(--accent-blue), #1d4ed8)' : 'var(--bg-input)',
                    border: '1px solid',
                    borderColor: isUser ? 'transparent' : 'var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1.1rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {msg.content || (isLoading && index === messages.length - 1 ? (
                    <span style={{ color: 'var(--accent-cyan)' }}>Thinking locally...</span>
                  ) : '')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input box */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder={
                ollamaStatus.available
                  ? `Ask local model (${selectedModel || 'none selected'})...`
                  : 'Ollama not detected on localhost:11434 (Optional)'
              }
              disabled={!ollamaStatus.available || isLoading}
              className="input-field"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!ollamaStatus.available || isLoading || !inputPrompt.trim()}
            >
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
