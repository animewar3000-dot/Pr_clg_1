import { useState, useRef, useEffect } from 'react';
import { config } from '../../lib/config';
import { Bot, Send, AlertCircle } from 'lucide-react';
import type { AIChatMessage } from '../../lib/types';

export function AIAssistantPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: 'assistant', content: 'Hello! I\'m the CampOS AI Assistant. I can help you with academic questions, campus information, finding resources, and more. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAIConfigured = config.ai.enabled;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AIChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (!isAIConfigured) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'AI services are not currently configured. To enable the AI assistant, the administrator needs to configure an AI provider (OpenAI, Anthropic, etc.) with proper API credentials. Please contact your college administrator.'
      }]);
      setIsLoading(false);
      return;
    }

    try {
      // In a real implementation, this would call a backend edge function
      // that performs RAG retrieval and generates a response
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.message, sources: data.sources }]);
      } else {
        throw new Error('AI service unavailable');
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m sorry, I\'m having trouble connecting to the AI service right now. Please try again later, or contact your administrator if the issue persists.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
      </div>

      {!isAIConfigured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">AI Not Configured</p>
            <p className="text-sm text-yellow-700 mt-1">
              The AI assistant requires backend configuration with an AI provider. 
              The chat interface is available for testing, but responses require proper API integration.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-[60vh]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">Sources:</p>
                    {msg.sources.map((src, j) => (
                      <p key={j} className="text-xs text-gray-500">• {src.title}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about campus, academics, or resources..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
