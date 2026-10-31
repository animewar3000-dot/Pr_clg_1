import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resourceUploadSchema } from '../../lib/validations';
import { Upload, Search, Download, BookOpen } from 'lucide-react';
import type { Resource } from '../../lib/types';
import type { z } from 'zod';

type FormData = z.infer<typeof resourceUploadSchema>;
type ResourceWithSignedUrl = Resource & { signed_url: string | null };

export function ResourcesPage() {
  const { user, profile } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources', profile?.college_id, search],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      let query = supabase.from('resources').select('*, uploader:profiles!uploaded_by(display_name)').eq('college_id', profile.college_id).eq('status', 'approved').order('created_at', { ascending: false });
      if (search) query = query.ilike('title', `%${search}%`);
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return Promise.all((data || []).map(async (resource) => {
        const { data: signed, error: signedError } = await supabase.storage
          .from('resources')
          .createSignedUrl(resource.file_url, 15 * 60);
        return { ...resource, signed_url: signedError ? null : signed.signedUrl } as ResourceWithSignedUrl;
      }));
    },
    enabled: !!supabase && !!profile,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!supabase || !profile || !user || !selectedFile) throw new Error('Missing data');
      const allowedTypes = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png']);
      if (!allowedTypes.has(selectedFile.type)) throw new Error('Upload a PDF, Word document, PowerPoint or PNG/JPEG image.');
      if (selectedFile.size > 20 * 1024 * 1024) throw new Error('File size must be 20 MB or less.');
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !/^(pdf|doc|docx|ppt|pptx|jpg|jpeg|png)$/.test(fileExt)) throw new Error('Unsupported file extension.');
      const filePath = `${profile.college_id}/${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('resources').upload(filePath, selectedFile, { contentType: selectedFile.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase.from('resources').insert({
        college_id: profile.college_id,
        subject_id: data.subjectId || null,
        title: data.title,
        description: data.description,
        type: data.type,
        file_url: filePath,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        uploaded_by: user.id,
        visibility: data.visibility,
        status: 'pending_review',
      });
      if (dbError) {
        await supabase.storage.from('resources').remove([filePath]);
        throw dbError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setShowUpload(false);
      setSelectedFile(null);
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(resourceUploadSchema),
  });

  const onSubmit = (data: FormData) => uploadMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Academic Resources</h1>
        <button onClick={() => setShowUpload(!showUpload)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Upload className="h-4 w-4" /> Upload Resource
        </button>
      </div>

      {showUpload && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Resource</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input {...register('title')} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea {...register('description')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select {...register('type')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="lecture_notes">Lecture Notes</option>
                  <option value="handwritten">Handwritten Notes</option>
                  <option value="previous_exam">Previous Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="lab_manual">Lab Manual</option>
                  <option value="reference">Reference</option>
                  <option value="study_guide">Study Guide</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select {...register('visibility')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="public">Public</option>
                  <option value="department">Department</option>
                  <option value="subject">Subject</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-sm" />\n              <p className="mt-1 text-xs text-gray-500">PDF, Word, PowerPoint or PNG/JPEG · Maximum 20 MB. Files are stored privately.</p>
            </div>
            <button type="submit" disabled={uploadMutation.isPending || !selectedFile} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading resources...</div>
      ) : !resources || resources.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No resources available yet. Be the first to upload!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{resource.type.replace(/_/g, ' ')}</p>
                </div>
                <a href={resource.file_url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded">
                  <Download className="h-4 w-4 text-gray-600" />
                </a>
              </div>
              {resource.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{resource.description}</p>}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>by {(resource.uploader as { display_name?: string })?.display_name || 'Unknown'}</span>
                <span>{(resource.file_size / 1024).toFixed(0)} KB</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
