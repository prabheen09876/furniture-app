import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const isMountedRef = useRef(true);

  const checkAdminStatus = async (userId?: string, mountedRef = isMountedRef): Promise<boolean> => {
    const userIdToCheck = userId || user?.id;
    if (!userIdToCheck) return false;
  
    try {
      // First check if the user is admin@example.com which should always be admin
      if (user?.email?.toLowerCase() === 'admin@example.com') {
        // Ensure admin record exists with all required fields
        const adminUserData = {
          id: userIdToCheck,
          email: user.email.toLowerCase(),
          role: 'super_admin',
          permissions: ['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Ensuring admin user exists:', { userId: userIdToCheck, email: user.email });
        const { error: adminError } = await supabase
          .from('admin_users')
          .upsert(adminUserData);
        
        if (adminError) {
          console.error('Error ensuring admin privileges:', adminError);
        } else {
          console.log('Admin privileges ensured for:', user.email);
        }
        
        if (mountedRef.current) {
          setIsAdmin(true);
        }
        return true;
      }
      
      // Otherwise check the admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userIdToCheck)
        .eq('is_active', true);
  
      // Check if data exists and has at least one row
      const adminStatus = !error && data && data.length > 0;
      if (mountedRef.current) {
        setIsAdmin(adminStatus);
      }
      return adminStatus;
    } catch (error) {
      console.error('Error checking admin status:', error);
      if (mountedRef.current) {
        setIsAdmin(false);
      }
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        console.log('Session restored:', session?.user?.email || 'No session');
        
        if (isMounted) {
          setUser(session?.user ?? null);
        }
        
        if (session?.user) {
          await checkAdminStatus(session.user.id, { current: isMounted });
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Exception during auth initialization:', error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };
    
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (isMounted) {
        setUser(session?.user ?? null);
      }
      
      if (session?.user) {
        await checkAdminStatus(session.user.id, { current: isMounted });
      } else {
        if (isMounted) {
          setIsAdmin(false);
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      if (data.user) {
        await checkAdminStatus(data.user.id, isMountedRef);
      }
      
      console.log('Sign in successful:', data.user?.email);
      return { error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const trimmedEmail = email.trim().toLowerCase();
      console.log('Attempting to sign up with:', { email: trimmedEmail });
      
      // Removed the initial email check to avoid 406 errors
      // Supabase Auth will handle duplicate email checks for us
      
      // Proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: undefined, // Will use the site URL from Supabase settings
          data: {
            full_name: '', // Will be set by the trigger
            email: trimmedEmail
          }
        },
      });
      
      // Enhanced error logging
      console.log('Signup response:', { 
        data: {
          user: data?.user ? { 
            id: data.user.id, 
            email: data.user.email, 
            email_confirmed: data.user.email_confirmed_at,
            created_at: data.user.created_at
          } : null,
          session: data?.session ? 'session received' : 'no session'
        },
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name,
          code: (error as any).code || 'unknown'
        } : null
      });
      
      if (error) {
        console.error('Sign up error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          code: (error as any).code || 'unknown',
          stack: error.stack
        });
        
        // Return a more detailed error
        return { 
          error: {
            ...error,
            code: (error as any).code || 'signup_failed',
            message: error.message || 'Failed to create account. Please try again.'
          } 
        };
      }
      
      if (!data.user) {
        console.error('No user data returned from signup');
        return { 
          error: { 
            message: 'Failed to create user. Please try again.',
            code: 'no_user_data'
          } 
        };
      }
      
      console.log('Sign up successful:', { 
        email: data.user.email, 
        id: data.user.id,
        emailConfirmed: !!data.user.email_confirmed_at
      });
      
      // If this is the admin user, add admin privileges
      if (data.user && trimmedEmail === 'admin@example.com') {
        try {
          console.log('Setting up admin privileges for:', trimmedEmail);
          const adminUserData = {
            id: data.user.id,
            email: trimmedEmail,
            role: 'super_admin',
            permissions: ['products:read', 'products:write', 'orders:read', 'orders:write', 'users:read', 'users:write', 'categories:read', 'categories:write'],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Inserting admin user:', adminUserData);
          const { error: adminError } = await supabase
            .from('admin_users')
            .upsert(adminUserData);
          
          if (adminError) {
            console.error('Error adding admin privileges:', adminError);
          } else {
            console.log('Admin privileges added successfully');
            await checkAdminStatus(data.user.id, isMountedRef);
          }
        } catch (adminError) {
          console.error('Exception adding admin privileges:', adminError);
        }
      }
      
      // Verify the profile was created
      if (data.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', data.user.id)
            .single();
            
          if (profileError) {
            console.error('Error verifying profile creation:', profileError);
          } else if (profile) {
            console.log('Profile verified:', profile);
          }
        } catch (e) {
          console.error('Exception verifying profile:', e);
        }
      }
      
      return { 
        error: null,
        data: {
          requiresEmailConfirmation: !data.user?.email_confirmed_at,
          userId: data.user?.id
        }
      };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { 
        error: { 
          message: 'An unexpected error occurred. Please try again.',
          code: 'unexpected_error',
          details: error 
        } 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      if (isMountedRef.current) {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Sign out exception:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut, 
      isAdmin,
      checkAdminStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};