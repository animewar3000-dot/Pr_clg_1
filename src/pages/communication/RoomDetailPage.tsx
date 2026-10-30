import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Send, ArrowLeft, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Message, Room } from '../../lib/types';

export function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch room details
  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!supabase || !roomId) return null;
      const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      return data as Room | null;
    },
    enabled: !!supabase && !!roomId,
  });

  // Fetch messages
  const { data: messages } = useQuery({
    queryKey: ['messages', roomId],
    queryFn: async () => {
      if (!supabase || !roomId) return [];
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!sender_id(display_name, avatar_url)')
        .eq('room_id', roomId)
        .eq('deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);
      return (data || []) as Message[];
    },
    enabled: !!supabase && !!roomId,
  });

  // Subscribe to realtime messages
  useEffect(() => {
    if (!supabase || !roomId) return;
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, roomId, queryClient]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!supabase || !roomId || !user) throw new Error('Not configured');
      const { error } = await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: user.id,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', roomId] });
      setNewMessage('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) sendMutation.mutate(newMessage.trim());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <button onClick={() => navigate('/rooms')} className="p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold">{room?.name || 'Room'}</h1>
          {room?.description && <p className="text-sm text-gray-500">{room.description}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {!messages || messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-3 py-2 ${msg.sender_id === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {msg.sender_id !== user?.id && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {(msg.sender as { display_name?: string })?.display_name || 'User'}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.sender_id === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
