import { useState, useRef, useEffect, Fragment } from 'react';
import { getSupabase } from '../../lib/supabase';
import { Bot, Send, AlertCircle, Sparkles, GraduationCap, BookOpen, Lightbulb, Compass, Copy, Check, RotateCcw } from 'lucide-react';
import type { AIChatMessage } from '../../lib/types';

type MarkdownBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; language: string; text: string };

function inlineMarkdown(text: string) {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|\`[^\`]+\`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index} className="font-semibold text-inherit">{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded-md bg-slate-200/80 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-800">{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="font-medium text-blue-700 underline underline-offset-2">{link[1]}</a>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = line.match(/^\`\`\`\s*([\w+-]*)/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\`\`\`/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push({ type: 'code', language: fence[1], text: code.join('\n') });
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] }); i++; continue; }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push({ type: 'quote', text: quote.join(' ') });
      continue;
    }
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    if (ordered || unordered) {
      const isOrdered = Boolean(ordered);
      const items: string[] = [];
      while (i < lines.length) {
        const match = isOrdered ? lines[i].match(/^\s*\d+[.)]\s+(.+)$/) : lines[i].match(/^\s*[-*+]\s+(.+)$/);
        if (!match) break;
        items.push(match[1]);
        i++;
      }
      blocks.push({ type: 'list', ordered: isOrdered, items });
      continue;
    }
    const paragraph = [line.trim()];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#{1,3})\s|^\`\`\`|^>\s?|^\s*(?:\d+[.)]|[-*+])\s+/.test(lines[i])) {
      paragraph.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }
  return blocks;
}

function AssistantMessage({ content }: { content: string }) {
  const blocks = parseMarkdown(content);
  return (
    <div className="space-y-3 text-[15px] leading-7 text-slate-700 sm:text-[15.5px]">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Tag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5';
          return <Tag key={index} className="pt-1 text-base font-bold tracking-tight text-slate-900">{inlineMarkdown(block.text)}</Tag>;
        }
        if (block.type === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return <Tag key={index} className={block.ordered ? 'list-decimal space-y-2 pl-5 marker:font-semibold marker:text-blue-600' : 'list-disc space-y-2 pl-5 marker:text-teal-600'}>
            {block.items.map((item, itemIndex) => <li key={itemIndex} className="pl-1">{inlineMarkdown(item)}</li>)}
          </Tag>;
        }
        if (block.type === 'quote') return <blockquote key={index} className="border-l-[3px] border-teal-400 pl-4 italic text-slate-600">{inlineMarkdown(block.text)}</blockquote>;
        if (block.type === 'code') return <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-slate-100">
          {block.language && <div className="border-b border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{block.language}</div>}
          <pre className="overflow-x-auto p-4 text-xs leading-6 sm:text-sm"><code>{block.text}</code></pre>
        </div>;
        return <p key={index}>{inlineMarkdown(block.text)}</p>;
      })}
    </div>
  );
}

const suggestions = [
  { icon: GraduationCap, label: 'Help me study', prompt: 'Help me create a focused study plan for this week.' },
  { icon: BookOpen, label: 'Explain a concept', prompt: 'Explain a difficult programming concept in simple terms.' },
  { icon: Lightbulb, label: 'Give me ideas', prompt: 'Suggest a practical project I can build as a first-year computer science student.' },
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabase();
  const isAIConfigured = Boolean(supabase);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent, suggestedText?: string) => {
    e?.preventDefault();
    const text = (suggestedText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: AIChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setServiceError('');
    setIsLoading(true);

    if (!supabase) {
      setServiceError('CampOS could not connect to its AI service. Please try again later.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('campus-ai', {
        body: { messages: nextMessages.slice(-10).map(({ role, content }) => ({ role, content })) },
      });
      if (error) throw error;
      if (typeof data?.message !== 'string' || !data.message.trim()) {
        throw new Error(data?.error || 'The AI service returned an invalid response.');
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown service error';
      setServiceError(message.includes('FunctionsFetchError')
        ? 'Could not reach the CampOS AI service. Please try again in a moment.'
        : 'The AI assistant is temporarily unavailable. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1600);
    } catch {
      setServiceError('Copy is unavailable in this browser.');
    }
  };

  const resetChat = () => {
    if (isLoading) return;
    setMessages([]);
    setServiceError('');
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pb-3 pt-3 sm:gap-5 sm:px-6 sm:pt-5 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-600/20">
            <Bot className="h-6 w-6" strokeWidth={2.2} />
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-[var(--camp-paper)] bg-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Pico <span className="font-semibold text-slate-500">· CampOS AI</span></h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-blue-700">Your campus co-pilot</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Curious mind. Clear answers. One campus at a time.</p>
          </div>
        </div>
        {messages.length > 0 && <button type="button" onClick={resetChat} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900 disabled:opacity-50">
          <RotateCcw className="h-3.5 w-3.5" /> New chat
        </button>}
      </header>

      {serviceError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{serviceError}</p>
        </div>
      )}

      <section className="flex h-[min(76dvh,58rem)] min-h-[32rem] flex-col overflow-hidden rounded-[1.6rem] border border-slate-200/90 bg-white shadow-[0_18px_55px_-35px_rgba(23,43,77,0.35)] sm:h-[min(78dvh,58rem)]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/70 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 text-blue-700"><Sparkles className="h-4 w-4" /></div>
            <div>
              <p className="text-xs font-bold text-slate-800">A little help goes a long way</p>
              <p className="text-[10px] text-slate-500">Powered by Groq · Always learning with you</p>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online</span>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.055),_transparent_55%)] px-3 py-5 sm:px-6 sm:py-6">
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center py-5 text-center">
              <div className="relative mb-5">
                <div className="grid h-20 w-20 place-items-center rounded-[1.8rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/20"><Bot className="h-10 w-10" /></div>
                <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-4 border-white bg-amber-300 text-amber-900"><Sparkles className="h-3.5 w-3.5" /></span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600">Meet your campus co-pilot</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Hey, I'm Pico.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Think of me as the curious friend in your corner. Ask me to break down a tough topic, plan your week, or brainstorm your next project.</p>
              <div className="mt-6 grid w-full gap-2.5 sm:grid-cols-3">
                {suggestions.map(({ icon: Icon, label, prompt }) => (
                  <button key={label} type="button" onClick={() => handleSend(undefined, prompt)} disabled={!isAIConfigured || isLoading} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md disabled:opacity-50 sm:flex-col sm:items-start sm:p-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-100"><Icon className="h-4 w-4" /></span>
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-5 text-[10px] text-slate-400">Pico can help with learning and ideas, but doesn't have access to live college records yet.</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex items-start gap-2.5 sm:gap-3'}>
                {msg.role === 'assistant' && <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm"><Bot className="h-4 w-4" /></div>}
                <div className={msg.role === 'user'
                  ? 'max-w-[88%] rounded-[1.25rem] rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-3 text-sm leading-6 text-white shadow-md shadow-blue-600/10 sm:max-w-[75%]'
                  : 'group min-w-0 max-w-[94%] flex-1 rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-4 py-4 shadow-[0_5px_18px_-14px_rgba(23,43,77,0.35)] sm:max-w-[88%] sm:px-5 sm:py-5'}>
                  {msg.role === 'assistant' ? <AssistantMessage content={msg.content} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
                  {msg.role === 'assistant' && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="text-[10px] font-semibold tracking-wide text-slate-400">PICO · CAMPos AI</span>
                      <button type="button" onClick={() => copyMessage(msg.content, i)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label="Copy response">
                        {copiedIndex === i ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        {copiedIndex === i ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                  {msg.sources && msg.sources.length > 0 && <div className="mt-3 border-t border-slate-100 pt-2"><p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Sources</p>{msg.sources.map((src, j) => <p key={j} className="text-xs text-slate-500">{src.title}</p>)}</div>}
                </div>
              </div>
            ))
          )}
          {isLoading && <div className="flex items-start gap-3"><div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white"><Bot className="h-4 w-4" /></div><div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="flex items-center gap-2"><span className="flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:150ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:300ms]" /></span><span className="text-xs text-slate-400">Pico is thinking…</span></div></div></div>}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-3 sm:p-4">
          <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-inner focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Message Pico…"
              aria-label="Message Pico"
              rows={1}
              className="max-h-28 min-h-11 flex-1 resize-y bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              disabled={isLoading || !isAIConfigured}
              maxLength={4000}
            />
            <button type="submit" disabled={!input.trim() || isLoading || !isAIConfigured} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400">Pico can make mistakes. Double-check important academic or campus information.</p>
        </form>
      </section>
    </main>
  );
}
