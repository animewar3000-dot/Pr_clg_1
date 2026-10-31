import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabase';
import { isSupabaseConfigured } from '../lib/config';
import type { Profile, UserRole, AccountStatus } from '../lib/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  roles: UserRole[];
  accountStatus: AccountStatus;
  isLoading: boolean;
  isProfileLoading: boolean;
  isConfigured: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, collegeCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    roles: [],
    accountStatus: 'pending_verification',
    isLoading: true,
    isProfileLoading: false,
    isConfigured: isSupabaseConfigured(),
    error: null,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    setState(prev => ({ ...prev, isProfileLoading: true, error: null }));
    if (!supabase) {
      setState(prev => ({ ...prev, isProfileLoading: false, isConfigured: false }));
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, role_assignments(role)')
        .eq('id', userId)
        .single();

      if (profileError) {
        setState(prev => ({
          ...prev,
          profile: null,
          roles: [],
          accountStatus: 'pending_verification',
          isProfileLoading: false,
          error: profileError.code === 'PGRST116'
            ? 'Your campus profile has not been provisioned yet. Contact your college administrator.'
            : profileError.message,
        }));
        return;
      }

      const roles = (profile?.role_assignments || []).map((assignment: { role: UserRole }) => assignment.role);
      setState(prev => ({
        ...prev,
        profile: profile as Profile,
        roles,
        accountStatus: profile.account_status as AccountStatus,
        isProfileLoading: false,
        error: null,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        profile: null,
        roles: [],
        isProfileLoading: false,
        error: err instanceof Error ? err.message : 'Could not load your campus profile.',
      }));
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState(prev => ({ ...prev, isLoading: false, isConfigured: false }));
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setState(prev => {
        const sameUser = Boolean(session?.user && session.user.id === prev.user?.id);
        return {
          ...prev,
          user: session?.user ?? null,
          session,
          isLoading: false,
          isProfileLoading: Boolean(session?.user) && (!sameUser || event === 'SIGNED_IN' || event === 'INITIAL_SESSION'),
          profile: sameUser ? prev.profile : null,
          roles: sameUser ? prev.roles : [],
          accountStatus: sameUser ? prev.accountStatus : 'pending_verification',
          error: null,
        };
      });

      if (session?.user && (!state.user || state.user.id !== session.user.id || event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED')) {
        // Defer Supabase queries until the auth callback releases its internal lock.
        window.setTimeout(() => { void fetchProfile(session.user.id); }, 0);
      }

      if (!session?.user) {
        setState(prev => ({
          ...prev,
          profile: null,
          roles: [],
          accountStatus: 'pending_verification',
          isProfileLoading: false,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, state.user]);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    setState(prev => ({ ...prev, error: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, collegeCode: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    setState(prev => ({ ...prev, error: null }));
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, college_code: collegeCode.trim().toUpperCase() } },
    });
    if (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setState(prev => ({
      ...prev,
      user: null,
      profile: null,
      session: null,
      roles: [],
      accountStatus: 'pending_verification',
      isProfileLoading: false,
    }));
  };

  const resetPassword = async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (state.user) await fetchProfile(state.user.id);
  };

  const hasRole = (role: UserRole) => state.roles.includes(role);
  const hasAnyRole = (roles: UserRole[]) => roles.some(role => state.roles.includes(role));

  return (
    <AuthContext.Provider value={{
      ...state,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      hasRole,
      hasAnyRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
