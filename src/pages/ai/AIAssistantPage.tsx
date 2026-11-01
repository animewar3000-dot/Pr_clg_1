import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, RotateCcw } from 'lucide-react';
import type { AIChatMessage } from '../../lib/types';
import { getSupabase } from '../../lib/supabase';

const suggestions = ['Explain a difficult topic simply', 'Help me plan my study week', 'Review this code'];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<AIChatMessage[]>([{ role: 'assistant', content: "Hey! I'm Robo, your CampOS buddy. 🤖 Ask me about studying, programming, productivity, or campus life. What are we working on today?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text = input) => {
    const prompt = text.trim();
    if (!prompt || loading) return;
    const next = [...messages, { role: 'user' as const, content: prompt }];
    setMessages(next); setInput(''); setError(''); setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('CampOS authentication is not configured.');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in again to chat with Robo.');
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ messages: next.slice(-20) }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Robo could not connect. Please try again.');
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to contact Robo.'); }
    finally { setLoading(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-5 animate-[camp-fade-up_.4s_ease-out_both]">
    <section className="relative flex items-center gap-4 overflow-hidden rounded-[28px] bg-[#172B4D] p-5 text-white shadow-xl sm:gap-7 sm:p-8">
      <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-[#386BE8]/30 blur-3xl"/>
      <div className="relative h-28 w-28 shrink-0 sm:h-36 sm:w-36"><img src="/robo.svg" alt="Robo, your CampOS AI companion" className="h-full w-full object-contain drop-shadow-xl"/></div>
      <div className="relative min-w-0"><p className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#14A89C]/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#75D7CC]"><Sparkles size={12}/> Your campus companion</p><h1 className="text-2xl font-black sm:text-3xl">Hey, I'm Robo!</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/65">Your friendly AI buddy for learning, coding, ideas and campus life.</p><p className="mt-3 text-xs font-bold text-white/50">Powered by Groq · Llama 3.3</p></div>
    </section>
    <section className="overflow-hidden rounded-[24px] border border-[#172B4D]/10 bg-white shadow-[0_18px_50px_rgba(23,43,77,.07)]">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#EAF0FF] text-[#386BE8]"><Bot size={18}/></span><div><p className="text-sm font-extrabold text-[#172B4D]">Chat with Robo</p><p className="text-[11px] text-slate-400">A helpful study companion</p></div></div><button type="button" onClick={()=>{setMessages([{role:'assistant',content:"Hey! I'm Robo, your CampOS buddy. 🤖 What can I help you with?"}]);setError('');}} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"><RotateCcw size={14}/> New chat</button></header>
      <div className="h-[min(56vh,560px)] min-h-[340px] space-y-4 overflow-y-auto bg-[#FBFCFF] p-4 sm:p-6">
        {messages.map((m,i)=><div key={i} className={`flex items-end gap-2.5 ${m.role==='user'?'justify-end':'justify-start'}`}>{m.role==='assistant'&&<img src="/robo.svg" alt="" className="h-9 w-9 shrink-0 object-contain"/>}<div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[78%] ${m.role==='user'?'rounded-br-md bg-[#386BE8] text-white':'rounded-bl-md border border-slate-100 bg-white text-[#172B4D]'}`}><p className="whitespace-pre-wrap text-sm leading-6">{m.content}</p></div></div>)}
        {loading&&<div className="flex items-end gap-2.5"><img src="/robo.svg" alt="" className="h-9 w-9 animate-bounce object-contain"/><div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">Robo is thinking...</div></div>}
        {error&&<p role="alert" className="ml-11 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</p>}<div ref={endRef}/>
      </div>
      {messages.length===1&&<div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 sm:px-6">{suggestions.map(s=><button key={s} type="button" onClick={()=>void send(s)} className="rounded-full border border-[#172B4D]/10 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-[#386BE8]/40 hover:bg-[#F0F4FF]">{s}</button>)}</div>}
      <form onSubmit={e=>{e.preventDefault();void send();}} className="border-t border-slate-100 bg-white p-3 sm:p-4"><div className="flex items-center gap-2 rounded-2xl border border-[#172B4D]/10 bg-[#F8FAFD] p-2 focus-within:ring-4 focus-within:ring-[#386BE8]/10"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Message Robo..." maxLength={6000} disabled={loading} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" aria-label="Message Robo"/><button type="submit" disabled={!input.trim()||loading} className="grid h-10 w-10 place-items-center rounded-xl bg-[#386BE8] text-white disabled:opacity-40" aria-label="Send message"><Send size={17}/></button></div><p className="mt-2 text-center text-[10px] text-slate-400">Robo can make mistakes. Don't share passwords or sensitive personal information.</p></form>
    </section>
  </div>;
}
