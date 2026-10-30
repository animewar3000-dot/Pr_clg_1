import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
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
  isConfigured: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
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
    isConfigured: isSupabaseConfigured(),
    error: null,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, role_assignments(role)')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
        return;
      }

      if (profile) {
        const roles = (profile.role_assignments || []).map((ra: { role: UserRole }) => ra.role);
        setState(prev => ({
          ...prev,
          profile: profile as Profile,
          roles,
          accountStatus: profile.account_status as AccountStatus,
        }));
      }
    } catch (err) {
      console.error('Profile fetch exception:', err);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setState(prev => ({ ...prev, isLoading: false, isConfigured: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(prev => ({
        ...prev,
        user: session?.user ?? null,
        session,
        isLoading: false,
      }));
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          session,
          isLoading: event === 'INITIAL_SESSION',
        }));
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setState(prev => ({ ...prev, profile: null, roles: [] }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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

  const signUp = async (email: string, password: string, displayName: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not configured');
    
    setState(prev => ({ ...prev, error: null }));
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
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
    setState(prev => ({ ...prev, profile: null, roles: [] }));
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
    if (state.user) {
      await fetchProfile(state.user.id);
    }
  };

  const hasRole = (role: UserRole) => state.roles.includes(role);
  const hasAnyRole = (roles: UserRole[]) => roles.some(r => state.roles.includes(r));

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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
