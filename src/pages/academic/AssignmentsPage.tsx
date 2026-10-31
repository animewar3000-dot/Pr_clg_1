import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenCheck, CalendarClock, CheckCircle2, ClipboardList, Plus, Send, X } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Assignment = {
  id: string;
  college_id: string;
  title: string;
  description: string;
  due_at: string;
  status: 'draft' | 'published' | 'closed';
  created_by: string;
  created_at: string;
};

type AssignmentSubmission = {
  id: string;
  assignment_id: string;
  student_id: string;
  answer_text: string;
  submitted_at: string;
  status: 'submitted' | 'late' | 'graded';
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
};

const fieldClass = 'mt-2 w-full rounded-xl border border-[#172B4D]/15 bg-white px-4 py-3 text-sm text-[#172B4D] outline-none focus:border-[#386BE8] focus:ring-4 focus:ring-[#386BE8]/10';

export function AssignmentsPage() {
  const { user, profile, hasAnyRole } = useAuth();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const canCreate = hasAnyRole(['faculty','department_admin','college_admin','super_admin']);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [submissionFor, setSubmissionFor] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [gradingFor, setGradingFor] = useState<string | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  const assignmentsQuery = useQuery<Assignment[]>({
    queryKey: ['assignments', profile?.college_id],
    queryFn: async () => {
      if (!supabase || !profile) return [];
      const { data, error } = await supabase.from('assignments').select('*').eq('college_id', profile.college_id).order('due_at', { ascending: true }).limit(100);
      if (error) throw error;
      return (data || []) as Assignment[];
    },
    enabled: Boolean(supabase && profile),
  });

  const submissionsQuery = useQuery<AssignmentSubmission[]>({
    queryKey: ['assignment-submissions', user?.id],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('assignment_submissions').select('*').order('submitted_at', { ascending: false }).limit(200);
      if (error) throw error;
      return (data || []) as AssignmentSubmission[];
    },
    enabled: Boolean(supabase && user),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !profile || !user) throw new Error('Sign in with a faculty or administrator account.');
      if (title.trim().length < 4 || description.trim().length < 10 || !dueAt) throw new Error('Enter a title, instructions and due date.');
      const { error } = await supabase.from('assignments').insert({
        college_id: profile.college_id,
        title: title.trim(),
        description: description.trim(),
        due_at: new Date(dueAt).toISOString(),
        status: 'published',
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setTitle(''); setDescription(''); setDueAt(''); setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ['assignments', profile?.college_id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!supabase || !submissionFor) throw new Error('Select an assignment first.');
      const { error } = await supabase.rpc('submit_campus_assignment', {
        p_assignment_id: submissionFor,
        p_answer_text: answerText.trim(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setSubmissionFor(null); setAnswerText('');
      await queryClient.invalidateQueries({ queryKey: ['assignment-submissions', user?.id] });
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const numericGrade = Number(grade);
      if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > 100) throw new Error('Enter a grade between 0 and 100.');
      const { error } = await supabase.rpc('grade_campus_submission', {
        p_submission_id: submissionId,
        p_grade: numericGrade,
        p_feedback: feedback,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setGradingFor(null); setGrade(''); setFeedback('');
      await queryClient.invalidateQueries({ queryKey: ['assignment-submissions', user?.id] });
    },
  });

  const assignments = assignmentsQuery.data || [];
  const submissions = submissionsQuery.data || [];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createMutation.isPending) createMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[.2em] text-[#386BE8]">CAMPOS / ACADEMICS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#172B4D]">Assignments</h1>
          <p className="mt-2 text-sm text-slate-500">Deadlines, submissions and feedback in one place.</p>
        </div>
        {canCreate && <button type="button" onClick={() => setShowCreate(value => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#386BE8] px-4 text-sm font-extrabold text-white hover:bg-[#2859CB]">{showCreate ? <X size={16}/> : <Plus size={16}/>} {showCreate ? 'Close' : 'Create assignment'}</button>}
      </header>

      {showCreate && canCreate && (
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-7">
          <div><p className="text-[10px] font-black tracking-[.18em] text-[#386BE8]">FACULTY WORKSPACE</p><h2 className="mt-1 text-xl font-black text-[#172B4D]">Publish an assignment</h2><p className="mt-1 text-xs text-slate-500">This first release publishes college-wide assignments. Section targeting can be configured after academic sections are seeded.</p></div>
          <div><label htmlFor="assignment-title" className="text-sm font-bold text-[#172B4D]">Title</label><input id="assignment-title" value={title} onChange={e=>setTitle(e.target.value)} minLength={4} maxLength={160} required className={fieldClass} placeholder="Assignment title"/></div>
          <div><label htmlFor="assignment-description" className="text-sm font-bold text-[#172B4D]">Instructions</label><textarea id="assignment-description" value={description} onChange={e=>setDescription(e.target.value)} minLength={10} maxLength={10000} required rows={4} className={fieldClass} placeholder="Explain the task, expected output and submission requirements…"/></div>
          <div className="max-w-sm"><label htmlFor="assignment-due" className="text-sm font-bold text-[#172B4D]">Due date and time</label><input id="assignment-due" type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} min={new Date().toISOString().slice(0,16)} required className={fieldClass}/></div>
          {createMutation.isError && <p role="alert" className="text-sm text-red-600">{createMutation.error instanceof Error ? createMutation.error.message : 'Assignment could not be published.'}</p>}
          <button type="submit" disabled={createMutation.isPending || title.trim().length<4 || description.trim().length<10 || !dueAt} className="rounded-xl bg-[#172B4D] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#386BE8] disabled:opacity-50">{createMutation.isPending ? 'Publishing…' : 'Publish assignment'}</button>
        </form>
      )}

      {assignmentsQuery.isError || submissionsQuery.isError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Academic assignments could not be loaded. Apply migration 002 and check your campus account permissions.</div>
      ) : assignmentsQuery.isLoading || submissionsQuery.isLoading ? (
        <div className="space-y-3">{[0,1,2].map(i=><div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100"/>)}</div>
      ) : assignments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#172B4D]/15 bg-white px-6 py-14 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300"/>
          <h2 className="mt-4 text-lg font-black text-[#172B4D]">No assignments yet</h2>
          <p className="mt-2 text-sm text-slate-500">Published assignments will appear here with their due dates.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {assignments.map(assignment=>{
            const ownSubmission = submissions.find(item=>item.assignment_id===assignment.id && item.student_id===user?.id);
            const isAuthor = assignment.created_by===user?.id || hasAnyRole(['department_admin','college_admin','super_admin']);
            const assignmentSubmissions = submissions.filter(item=>item.assignment_id===assignment.id);
            return (
              <article key={assignment.id} className="rounded-3xl border border-[#172B4D]/10 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#E9F0FF] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#386BE8]"><BookOpenCheck size={13}/> {assignment.status}</span>
                  <span className="text-right text-xs font-bold text-slate-500">{new Date(assignment.due_at).toLocaleString()}</span>
                </div>
                <h2 className="mt-4 text-xl font-black text-[#172B4D]">{assignment.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{assignment.description}</p>
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><CalendarClock size={14}/> Due {new Date(assignment.due_at).toLocaleDateString()}</div>

                {!isAuthor && (ownSubmission ? (
                  <div className="mt-5 rounded-2xl border border-[#14A89C]/20 bg-[#EAF7F4] p-4">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-[#147A6A]"><CheckCircle2 size={16}/> {ownSubmission.status === 'graded' ? 'Graded' : ownSubmission.status === 'late' ? 'Submitted late' : 'Submitted'}</p>
                    {ownSubmission.grade !== null && <p className="mt-2 text-2xl font-black text-[#172B4D]">{ownSubmission.grade}/100</p>}
                    {ownSubmission.feedback && <p className="mt-2 text-sm text-slate-600">{ownSubmission.feedback}</p>}
                    <p className="mt-2 text-[11px] text-slate-500">Submitted {new Date(ownSubmission.submitted_at).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="mt-5">
                    {submissionFor===assignment.id ? (
                      <form onSubmit={event=>{event.preventDefault();submitMutation.mutate();}} className="space-y-3 rounded-2xl bg-[#F4F7FF] p-4">
                        <label htmlFor={`answer-${assignment.id}`} className="text-sm font-bold text-[#172B4D]">Your submission</label>
                        <textarea id={`answer-${assignment.id}`} value={answerText} onChange={e=>setAnswerText(e.target.value)} rows={5} maxLength={10000} required className="w-full rounded-xl border border-[#172B4D]/15 bg-white p-3 text-sm outline-none focus:border-[#386BE8]" placeholder="Write your answer or submission notes…"/>
                        {submitMutation.isError && <p role="alert" className="text-xs text-red-600">{submitMutation.error instanceof Error ? submitMutation.error.message : 'Submission failed.'}</p>}
                        <div className="flex gap-2"><button type="submit" disabled={!answerText.trim()||submitMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#386BE8] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"><Send size={14}/> {submitMutation.isPending?'Submitting…':'Submit'}</button><button type="button" onClick={()=>{setSubmissionFor(null);setAnswerText('');}} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Cancel</button></div>
                      </form>
                    ) : (
                      <button type="button" onClick={()=>setSubmissionFor(assignment.id)} className="w-full rounded-xl bg-[#172B4D] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#386BE8]">Submit assignment</button>
                    )}
                  </div>
                ))}

                {isAuthor && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500">Submissions · {assignmentSubmissions.length}</p>
                    {assignmentSubmissions.length===0 ? <p className="mt-2 text-xs text-slate-400">No student submissions yet.</p> : assignmentSubmissions.map(submission=>(
                      <div key={submission.id} className="mt-3 rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-bold text-slate-500">Student · {new Date(submission.submitted_at).toLocaleString()} · {submission.status}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-[#172B4D]">{submission.answer_text}</p>
                        {submission.grade!==null ? <p className="mt-2 text-sm font-extrabold text-[#147A6A]">Grade: {submission.grade}/100</p> : gradingFor===submission.id ? (
                          <form onSubmit={event=>{event.preventDefault();gradeMutation.mutate(submission.id);}} className="mt-3 space-y-2">
                            <input type="number" min="0" max="100" step="0.5" value={grade} onChange={e=>setGrade(e.target.value)} required className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Grade out of 100"/>
                            <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Feedback (optional)"/>
                            {gradeMutation.isError && <p role="alert" className="text-xs text-red-600">{gradeMutation.error instanceof Error ? gradeMutation.error.message : 'Could not save grade.'}</p>}
                            <div className="flex gap-2"><button type="submit" disabled={!grade||gradeMutation.isPending} className="rounded-lg bg-[#386BE8] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save grade</button><button type="button" onClick={()=>setGradingFor(null)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Cancel</button></div>
                          </form>
                        ) : <button type="button" onClick={()=>{setGradingFor(submission.id);setGrade('');setFeedback('');}} className="mt-2 rounded-lg bg-[#172B4D] px-3 py-2 text-xs font-bold text-white">Grade submission</button>}
                        {submission.feedback && <p className="mt-2 text-xs text-slate-500">Feedback: {submission.feedback}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
