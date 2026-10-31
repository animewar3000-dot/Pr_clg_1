import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileUpdateSchema } from '../lib/validations';
import { getSupabase } from '../lib/supabase';
import { User, Shield } from 'lucide-react';
import type { z } from 'zod';

type FormData = z.infer<typeof profileUpdateSchema>;

export function ProfilePage() {
  const { user, profile, roles, accountStatus, refreshProfile } = useAuth();
  const supabase = getSupabase();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(profileUpdateSchema),
    values: {
      displayName: profile?.display_name,
      bio: profile?.bio || '',
      interests: profile?.interests || [],
      skills: profile?.skills || [],
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!supabase || !user) return;
    setError('');
    setSuccess('');
    try {
      const { error: updateError } = await supabase.from('profiles').update({
        display_name: data.displayName,
        bio: data.bio,
        interests: data.interests || [],
        skills: data.skills || [],
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#172B4D]">Profile</h1>

      {/* Account Info */}
      <div className="bg-white border border-[#172B4D]/10 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-[#386BE8]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{profile?.display_name || 'User'}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            {profile?.campus_id && <p className="text-sm text-[#386BE8] font-medium">ID: {profile.campus_id}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Status:</span>
            <span className={`ml-2 font-medium ${accountStatus === 'active' ? 'text-green-600' : accountStatus === 'suspended' ? 'text-red-600' : 'text-yellow-600'}`}>
              {accountStatus.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Roles:</span>
            <span className="ml-2 font-medium">{roles.length > 0 ? roles.join(', ') : 'student'}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="bg-white border border-[#172B4D]/10 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
        
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm mb-4">{success}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
            <input {...register('displayName')} className="w-full px-3 py-2 border border-[#172B4D]/15 rounded-md" />
            {errors.displayName && <p className="text-sm text-red-600 mt-1">{errors.displayName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea {...register('bio')} rows={3} className="w-full px-3 py-2 border border-[#172B4D]/15 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Interests (comma-separated)</label>
            <input {...register('interests')} className="w-full px-3 py-2 border border-[#172B4D]/15 rounded-md" placeholder="coding, music, sports" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
            <input {...register('skills')} className="w-full px-3 py-2 border border-[#172B4D]/15 rounded-md" placeholder="Python, JavaScript, Design" />
          </div>
          <button type="submit" className="bg-[#386BE8] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#2859CB]">
            Save Changes
          </button>
        </form>
      </div>

      {/* Permissions Info */}
      <div className="bg-white border border-[#172B4D]/10 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold">Permissions</h2>
        </div>
        <p className="text-sm text-slate-600">
          Your access to features is determined by your verified role and account status. 
          Academic assignments (department, program, section) are managed by administration 
          and cannot be self-modified.
        </p>
      </div>
    </div>
  );
}
