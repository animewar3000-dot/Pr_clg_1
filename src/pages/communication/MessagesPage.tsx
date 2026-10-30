import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Search, Plus, MessageSquare } from 'lucide-react';
import type { Conversation, Message, Profile } from '../../lib/types';

export function MessagesPage() {
  const { user } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data } = await supabase
        .from('conversation_members')
        .select('conversation:conversations(*, conversation_members(*, user:profiles(display_name, avatar_url)))')
        .eq('user_id', user.id);
      return (data || []).map((d: any) => d.conversation) as unknown as Conversation[];
    },
    enabled: !!supabase && !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages } = useQuery({
    queryKey: ['dm-messages', selectedConversation],
    queryFn: async () => {
      if (!supabase || !selectedConversation) return [];
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(display_name, avatar_url)')
        .eq('conversation_id', selectedConversation)
        .eq('deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);
      return (data || []) as Message[];
    },
    enabled: !!supabase && !!selectedConversation,
  });

  // Search users
  const { data: searchResults } = useQuery({
    queryKey: ['user-search', searchUser],
    queryFn: async () => {
      if (!supabase || !searchUser || searchUser.length < 2) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, campus_id, avatar_url')
        .neq('id', user?.id)
        .ilike('display_name', `%${searchUser}%`)
        .limit(10);
      return (data || []) as Pick<Profile, 'id' | 'display_name' | 'campus_id' | 'avatar_url'>[];
    },
    enabled: !!supabase && searchUser.length >= 2,
  });

  // Realtime subscription
  useEffect(() => {
    if (!supabase || !selectedConversation) return;
    const channel = supabase
      .channel(`dm:${selectedConversation}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['dm-messages', selectedConversation] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, selectedConversation, queryClient]);

  // Send message
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!supabase || !selectedConversation || !user) throw new Error('Not configured');
      const { error } = await supabase.from('messages').insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-messages', selectedConversation] });
      setNewMessage('');
    },
  });

  // Start conversation
  const startConversation = async (otherUserId: string) => {
    if (!supabase || !user) return;
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);
    
    const myConvIds = (existing || []).map(e => e.conversation_id);
    if (myConvIds.length > 0) {
      for (const convId of myConvIds) {
        const { data: members } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', convId);
        const memberIds = (members || []).map(m => m.user_id);
        if (memberIds.length === 2 && memberIds.includes(otherUserId)) {
          setSelectedConversation(convId);
          setShowNewChat(false);
          return;
        }
      }
    }
    // Create new conversation
    const { data: conv } = await supabase.from('conversations').insert({ type: 'direct', created_by: user.id }).select().single();
    if (conv) {
      await supabase.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId },
      ]);
      setSelectedConversation(conv.id);
      setShowNewChat(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) sendMutation.mutate(newMessage.trim());
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] border border-gray-200 rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold">Messages</h2>
          <button onClick={() => setShowNewChat(!showNewChat)} className="p-1 hover:bg-gray-100 rounded">
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        {showNewChat && (
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded"
              />
            </div>
            {searchResults && searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => startConversation(u.id)} className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded">
                    {u.display_name} <span className="text-gray-400">({u.campus_id})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {!conversations || conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No conversations yet
            </div>
          ) : (
            conversations.map(conv => {
              const otherMember = conv.members?.find(m => m.user?.id !== user?.id);
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${selectedConversation === conv.id ? 'bg-blue-50' : ''}`}
                >
                  <p className="font-medium text-sm">{otherMember?.user?.display_name || 'Conversation'}</p>
                  <p className="text-xs text-gray-500">{conv.type === 'group' ? conv.title : 'Direct message'}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages?.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg px-3 py-2 ${msg.sender_id === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
