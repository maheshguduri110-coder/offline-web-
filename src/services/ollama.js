/**
 * Ollama Local AI Service
 * Connects ONLY to localhost (127.0.0.1 or localhost:11434).
 * Never makes outbound internet calls.
 * Gracefully reports offline/unavailable status.
 */

export class OllamaService {
  constructor(baseUrl = 'http://127.0.0.1:11434') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setBaseUrl(url) {
    this.baseUrl = (url || 'http://127.0.0.1:11434').replace(/\/+$/, '');
  }

  // Check if Ollama service is reachable locally
  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          available: false,
          models: [],
          error: `Ollama returned status ${res.status}`
        };
      }

      const data = await res.json();
      const models = (data.models || []).map((m) => m.name);

      return {
        available: true,
        models,
        error: null
      };
    } catch (err) {
      return {
        available: false,
        models: [],
        error: err.name === 'AbortError' 
          ? 'Connection timed out. Ensure Ollama is running locally on port 11434.'
          : 'Cannot reach Ollama on localhost. Is Ollama installed and running?'
      };
    }
  }

  // Generate response from local Ollama model
  async generate({ model, prompt, systemPrompt = '', onChunk = null }) {
    if (!model) {
      throw new Error('Please select a local model first.');
    }

    try {
      const controller = new AbortController();
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          system: systemPrompt || 'You are an intelligent, helpful offline AI assistant operating purely on local hardware without internet access.',
          stream: Boolean(onChunk)
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama generation error (${res.status}): ${text || 'Unknown error'}`);
      }

      // If streaming response
      if (onChunk && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((l) => l.trim() !== '');

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                fullResponse += parsed.response;
                onChunk(parsed.response, fullResponse);
              }
            } catch {
              // Ignore partial JSON lines in stream
            }
          }
        }
        return fullResponse;
      } else {
        // Non-stream
        const data = await res.json();
        return data.response || '';
      }
    } catch (err) {
      console.error('Ollama request failed:', err);
      throw new Error(err.message || 'Failed to communicate with local Ollama service.');
    }
  }
}

export const ollamaService = new OllamaService();
