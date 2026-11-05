import { useState, useRef, useEffect } from 'react';
import { getSupabase } from '../../lib/supabase';
import { Bot, Send, AlertCircle } from 'lucide-react';
import type { AIChatMessage } from '../../lib/types';

export function AIAssistantPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm the CampOS AI Assistant. I can help with academic questions, study planning, and general campus-life guidance. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();
  const isAIConfigured = Boolean(supabase);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: AIChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setServiceError('');
    setIsLoading(true);

    if (!supabase) {
      setServiceError('Connect CampOS to Supabase before using the AI assistant.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('campus-ai', {
        body: {
          messages: nextMessages.slice(-10).map(({ role, content }) => ({ role, content })),
        },
      });

      if (error) throw error;
      if (typeof data?.message !== 'string' || !data.message.trim()) {
        throw new Error(data?.error || 'The AI service returned an invalid response.');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown service error';
      setServiceError(message.includes('FunctionsFetchError')
        ? 'Could not reach the CampOS AI service. It may not be deployed or configured yet.'
        : 'The AI assistant is temporarily unavailable. Please try again in a moment.');
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

      {(!isAIConfigured || serviceError) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">AI Service Setup</p>
            <p className="text-sm text-yellow-700 mt-1">
              {serviceError || 'The AI assistant needs a configured Supabase connection and a deployed campus-ai function with the Groq API key stored as a server-side secret.'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg flex flex-col h-[60vh]">
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

        <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about studies, campus life, or academic concepts..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              maxLength={4000}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !isAIConfigured}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
