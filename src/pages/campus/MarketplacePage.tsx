import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema } from '../../lib/validations';
import { Plus, ShoppingBag, Search } from 'lucide-react';
import type { MarketplaceListing } from '../../lib/types';
import type { z } from 'zod';

type FormData = z.infer<typeof listingSchema>;

export function MarketplacePage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings', profile?.college_id, search],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      let query = supabase.from('marketplace_listings').select('*, seller:profiles!seller_id(display_name)').eq('college_id', profile.college_id).eq('status', 'active').order('created_at', { ascending: false });
      if (search) query = query.ilike('title', `%${search}%`);
      const { data } = await query.limit(50);
      return (data || []) as MarketplaceListing[];
    },
    enabled: !!supabase && !!profile,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!supabase || !profile || !user) throw new Error('Not configured');
      const { error } = await supabase.from('marketplace_listings').insert({
        college_id: profile.college_id,
        seller_id: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.isFree ? null : data.price,
        is_free: data.isFree,
        status: 'active',
        image_urls: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setShowCreate(false);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(listingSchema) as any,
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Listing
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">New Listing</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input {...register('title')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.title && <p className="text-sm text-red-600 mt-1">{String(errors.title.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.description && <p className="text-sm text-red-600 mt-1">{String(errors.description.message)}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input {...register('category')} placeholder="e.g., Books, Electronics" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                {errors.category && <p className="text-sm text-red-600 mt-1">{String(errors.category.message)}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input type="number" {...register('price', { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isFree')} className="rounded" />
              <span className="text-sm text-gray-700">This item is free</span>
            </label>
            <button type="submit" disabled={createMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? 'Creating...' : 'Create Listing'}
            </button>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading listings...</div>
      ) : !listings || listings.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No listings yet. Be the first to sell!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900">{listing.title}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">{listing.category}</span>
              <p className="text-sm text-gray-600 mt-2">{listing.description}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="font-semibold text-gray-900">{listing.is_free ? 'FREE' : `₹${listing.price}`}</span>
                <span className="text-xs text-gray-500">by {(listing.seller as { display_name?: string })?.display_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
