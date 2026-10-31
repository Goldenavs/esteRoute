import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'citizen' | 'dispatcher' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  stewardship_score?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAdminOrDispatcher: boolean;
  isCitizen: boolean;
  isGuest: boolean;
  isGuestMode: boolean;
  token: string | null;
  logout: () => Promise<void>;
  enterGuestMode: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && sessionStorage.getItem('esteroute_guest_session') === 'true';
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url, stewardship_score')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching user profile:', error.message);
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
    } catch (err) {
      console.warn('Profile fetch threw an exception:', err);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const enterGuestMode = useCallback(() => {
    sessionStorage.setItem('esteroute_guest_session', 'true');
    setIsGuestMode(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          sessionStorage.removeItem('esteroute_guest_session');
          setIsGuestMode(false);
          await fetchProfile(currentUser.id);
        }
      } catch (error) {
        console.error('Error during initial session retrieval:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      const currentUser = newSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        sessionStorage.removeItem('esteroute_guest_session');
        setIsGuestMode(false);
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    try {
      sessionStorage.removeItem('esteroute_guest_session');
      localStorage.removeItem('esteroute_my_reports');
      setIsGuestMode(false);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsGuestMode(false);
      sessionStorage.removeItem('esteroute_guest_session');
      localStorage.removeItem('esteroute_my_reports');
    }
  }, []);

  const role = useMemo<UserRole | null>(() => {
    return profile?.role ?? null;
  }, [profile?.role]);

  const isAdminOrDispatcher = useMemo<boolean>(() => {
    return role === 'admin' || role === 'dispatcher';
  }, [role]);

  const isCitizen = useMemo<boolean>(() => {
    return role === 'citizen';
  }, [role]);

  const isGuest = useMemo<boolean>(() => {
    return !user;
  }, [user]);

  const token = useMemo<string | null>(() => {
    return session?.access_token ?? null;
  }, [session?.access_token]);

  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    session,
    profile,
    role,
    isLoading,
    isAdminOrDispatcher,
    isCitizen,
    isGuest,
    isGuestMode,
    token,
    logout,
    enterGuestMode,
    refreshProfile
  }), [
    user,
    session,
    profile,
    role,
    isLoading,
    isAdminOrDispatcher,
    isCitizen,
    isGuest,
    isGuestMode,
    token,
    logout,
    enterGuestMode,
    refreshProfile
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
