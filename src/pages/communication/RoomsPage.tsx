import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomCreateSchema } from '../../lib/validations';
import { Plus, Search, Users } from 'lucide-react';
import type { Room } from '../../lib/types';
import type { z } from 'zod';

type RoomFormData = z.infer<typeof roomCreateSchema>;

export function RoomsPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: rooms, isLoading, isError: roomsError } = useQuery({
    queryKey: ['rooms', profile?.college_id, search],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      let query = supabase.from('rooms').select('*').eq('college_id', profile.college_id).order('created_at', { ascending: false });
      if (search) query = query.ilike('name', `%${search}%`);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return (data || []) as Room[];
    },
    enabled: !!supabase && !!profile,
  });

  const { data: myRoomIds, isError: membershipsError } = useQuery({
    queryKey: ['room-memberships', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase.from('room_members').select('room_id').eq('user_id', user.id);
      if (error) throw error;
      return (data || []).map(d => d.room_id);
    },
    enabled: !!supabase && !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: RoomFormData) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data: roomId, error } = await supabase.rpc('create_campus_room', {
        p_name: data.name,
        p_description: data.description || '',
        p_type: data.type,
        p_visibility: data.visibility,
      });
      if (error) throw error;
      return roomId as string;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
      await queryClient.invalidateQueries({ queryKey: ['room-memberships'] });
      setShowCreate(false);
      reset();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (roomId: string) => {
      if (!supabase || !user) throw new Error('Not configured');
      const { error } = await supabase.from('room_members').insert({ room_id: roomId, user_id: user.id, role: 'member' });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['room-memberships'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(roomCreateSchema) as any,
  });

  const onSubmit = (data: RoomFormData) => createMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campus Rooms</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Room
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Create a New Room</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
              <input {...register('name')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
              {errors.name && <p className="text-sm text-red-600 mt-1">{String(errors.name.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select {...register('type')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="interest_community">Interest Community</option>
                  <option value="study_group">Study Group</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select {...register('visibility')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {createMutation.isPending ? 'Creating...' : 'Create Room'}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); reset(); }} className="px-4 py-2 border border-gray-300 rounded-md text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search rooms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {createMutation.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{createMutation.error instanceof Error ? createMutation.error.message : 'Room could not be created.'}</p>}
      {joinMutation.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{joinMutation.error instanceof Error ? joinMutation.error.message : 'Could not join room.'}</p>}
      {roomsError || membershipsError ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Campus rooms could not be loaded. Check your account approval and Supabase policies.</p>
      ) : isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading rooms...</div>
      ) : !rooms || rooms.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No rooms found. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const isMember = myRoomIds?.includes(room.id);
            return (
              <div key={room.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <Link to={`/rooms/${room.id}`} className="font-semibold text-gray-900 hover:text-blue-600">{room.name}</Link>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{room.description || 'No description'}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{room.type.replace(/_/g, ' ')}</span>
                  {!isMember && room.visibility === 'public' && (
                    <button disabled={joinMutation.isPending} onClick={() => joinMutation.mutate(room.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50">
                      Join
                    </button>
                  )}
                  {isMember && <span className="text-xs text-green-600 font-medium">Member</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
