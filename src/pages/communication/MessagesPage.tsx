import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Plus, Search, Send } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Message } from '../../lib/types';

type ConversationSummary = {
  id: string;
  type: 'direct' | 'group';
  title: string | null;
  last_message_at: string | null;
  other_display_name: string;
  other_avatar_url: string | null;
};

type DirectoryUser = {
  id: string;
  display_name: string;
  campus_id: string | null;
  avatar_url: string | null;
};

export function MessagesPage() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = useQuery<ConversationSummary[]>({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.rpc('list_my_conversations');
      if (error) throw error;
      return (data || []) as ConversationSummary[];
    },
    enabled: Boolean(supabase && user),
  });

  const messagesQuery = useQuery<Message[]>({
    queryKey: ['dm-messages', selectedConversation],
    queryFn: async () => {
      if (!supabase || !selectedConversation) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .eq('deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: Boolean(supabase && selectedConversation),
  });

  const directoryQuery = useQuery<DirectoryUser[]>({
    queryKey: ['campus-directory', searchUser],
    queryFn: async () => {
      if (!supabase || searchUser.trim().length < 2) return [];
      const { data, error } = await supabase.rpc('search_campus_directory', { p_query: searchUser.trim() });
      if (error) throw error;
      return (data || []) as DirectoryUser[];
    },
    enabled: Boolean(supabase && user && showNewChat && searchUser.trim().length >= 2),
  });

  const startConversationMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase.rpc('create_direct_conversation', { p_other_user_id: otherUserId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: async (conversationId) => {
      setSelectedConversation(conversationId);
      setShowNewChat(false);
      setSearchUser('');
      await queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!supabase || !selectedConversation || !user) throw new Error('Not signed in.');
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setNewMessage('');
      await queryClient.invalidateQueries({ queryKey: ['dm-messages', selectedConversation] });
      await queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
    },
  });

  useEffect(() => {
    if (!supabase || !selectedConversation) return;
    const channel = supabase
      .channel(`dm:${selectedConversation}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['dm-messages', selectedConversation] });
        queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase, selectedConversation, queryClient, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesQuery.data]);

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = newMessage.trim();
    if (message && !sendMutation.isPending) sendMutation.mutate(message);
  };

  const conversations = conversationsQuery.data || [];
  const selected = conversations.find(conversation => conversation.id === selectedConversation);

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[420px] overflow-hidden rounded-2xl border border-[#172B4D]/10 bg-white shadow-sm">
      <aside className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-[#172B4D]/10 bg-white md:w-80`}>
        <div className="flex items-center justify-between border-b border-[#172B4D]/10 p-4">
          <div>
            <p className="text-[10px] font-black tracking-[.18em] text-[#386BE8]">CAMPUS / PRIVATE</p>
            <h2 className="mt-1 text-lg font-black text-[#172B4D]">Messages</h2>
          </div>
          <button
            type="button"
            onClick={() => { setShowNewChat(value => !value); setSearchUser(''); }}
            aria-label={showNewChat ? 'Close new conversation search' : 'Start a new conversation'}
            className="grid h-10 w-10 place-items-center rounded-xl bg-[#172B4D] text-white transition hover:bg-[#386BE8]"
          >
            <Plus size={18} />
          </button>
        </div>

        {showNewChat && (
          <div className="border-b border-[#172B4D]/10 p-3">
            <label htmlFor="campus-user-search" className="mb-2 block text-xs font-bold text-[#172B4D]">Find a campus member</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="campus-user-search"
                type="search"
                placeholder="Name or Campus ID"
                value={searchUser}
                onChange={event => setSearchUser(event.target.value)}
                className="w-full rounded-xl border border-[#172B4D]/15 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#386BE8] focus:ring-4 focus:ring-[#386BE8]/10"
              />
            </div>
            {searchUser.trim().length < 2 ? (
              <p className="mt-2 text-xs text-slate-500">Enter at least two characters to search the verified campus directory.</p>
            ) : directoryQuery.isLoading ? (
              <p className="mt-2 text-xs text-slate-500">Searching campus directory…</p>
            ) : directoryQuery.isError ? (
              <p role="alert" className="mt-2 text-xs text-red-600">Directory search is unavailable. Confirm migration 002 is applied.</p>
            ) : directoryQuery.data?.length ? (
              <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                {directoryQuery.data.map(candidate => (
                  <button
                    type="button"
                    key={candidate.id}
                    disabled={startConversationMutation.isPending}
                    onClick={() => startConversationMutation.mutate(candidate.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#F2F5FC] disabled:opacity-50"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E9F0FF] text-sm font-black text-[#386BE8]">
                      {candidate.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#172B4D]">{candidate.display_name}</span>
                      <span className="block truncate text-[11px] text-slate-500">{candidate.campus_id || 'Campus member'}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No searchable active members found.</p>
            )}
            {startConversationMutation.isError && <p role="alert" className="mt-2 text-xs text-red-600">{startConversationMutation.error instanceof Error ? startConversationMutation.error.message : 'Could not start conversation.'}</p>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="space-y-3 p-4">{[0, 1, 2].map(item => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : conversationsQuery.isError ? (
            <p role="alert" className="p-4 text-sm text-red-600">Could not load conversations. {conversationsQuery.error instanceof Error ? conversationsQuery.error.message : ''}</p>
          ) : conversations.length ? (
            conversations.map(conversation => (
              <button
                type="button"
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-[#F8FAFF] ${selectedConversation === conversation.id ? 'bg-[#EEF3FF]' : ''}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#172B4D] text-sm font-black text-white">
                  {(conversation.other_display_name || 'C').slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-[#172B4D]">{conversation.other_display_name || conversation.title || 'Conversation'}</span>
                  <span className="mt-1 block text-[11px] text-slate-500">{conversation.type === 'group' ? 'Group conversation' : 'Direct message'}</span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-5 py-12 text-center">
              <MessageSquare className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-[#172B4D]">No conversations yet</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Start a private conversation with someone in your campus directory.</p>
            </div>
          )}
        </div>
      </aside>

      <section className={`${selectedConversation ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-[#FCFCFD]`}>
        {!selectedConversation ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#E9F0FF] text-[#386BE8]"><MessageSquare size={28} /></span>
              <h2 className="mt-4 text-lg font-black text-[#172B4D]">Your private campus space</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Choose a conversation or start a new one with a verified campus member.</p>
            </div>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-[#172B4D]/10 bg-white px-4 py-3">
              <button type="button" onClick={() => setSelectedConversation(null)} className="grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 md:hidden" aria-label="Back to conversations">
                <ArrowLeft size={18} />
              </button>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#172B4D] text-sm font-black text-white">
                {(selected?.other_display_name || 'C').slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold text-[#172B4D]">{selected?.other_display_name || selected?.title || 'Conversation'}</h2>
                <p className="text-[11px] text-slate-500">Private campus conversation</p>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messagesQuery.isLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">Loading messages…</p>
              ) : messagesQuery.isError ? (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Messages could not be loaded. Check conversation membership and database policies.</p>
              ) : messagesQuery.data?.length ? (
                messagesQuery.data.map(message => (
                  <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${message.sender_id === user?.id ? 'rounded-br-md bg-[#172B4D] text-white' : 'rounded-bl-md border border-[#172B4D]/10 bg-white text-[#172B4D]'}`}>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${message.sender_id === user?.id ? 'text-white/55' : 'text-slate-400'}`}>
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">This is the beginning of your conversation.</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-[#172B4D]/10 bg-white p-3 sm:p-4">
              {sendMutation.isError && <p role="alert" className="mb-2 text-xs text-red-600">{sendMutation.error instanceof Error ? sendMutation.error.message : 'Message could not be sent.'}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={event => setNewMessage(event.target.value)}
                  placeholder="Write a message…"
                  maxLength={5000}
                  aria-label="Message"
                  className="min-w-0 flex-1 rounded-xl border border-[#172B4D]/15 px-4 py-3 text-sm outline-none focus:border-[#386BE8] focus:ring-4 focus:ring-[#386BE8]/10"
                />
                <button type="submit" disabled={!newMessage.trim() || sendMutation.isPending} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#386BE8] text-white transition hover:bg-[#2859CB] disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send message">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
