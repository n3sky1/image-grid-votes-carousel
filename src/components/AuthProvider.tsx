
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isInitializing: boolean; // Add flag to track initialization state
}

// Initial context value with isInitializing=true
const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null, 
  isInitializing: true 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true); // Track initialization

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // If we receive any auth event, we're no longer initializing
        if (isInitializing) {
          setIsInitializing(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "Active" : "None");
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Mark initialization complete after checking session
      setIsInitializing(false);
    });

    // Refresh session if needed - in case token is close to expiration
    const refreshInterval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (currentSession?.expires_at) {
          const expiresAt = new Date(currentSession.expires_at * 1000);
          const now = new Date();
          const timeLeft = (expiresAt.getTime() - now.getTime()) / 1000 / 60; // minutes
          
          if (timeLeft < 5) { // less than 5 minutes left
            console.log("Session expiring soon, refreshing...");
            supabase.auth.refreshSession();
          }
        }
      });
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [isInitializing]);

  return (
    <AuthContext.Provider value={{ session, user, isInitializing }}>
      {children}
    </AuthContext.Provider>
  );
};
