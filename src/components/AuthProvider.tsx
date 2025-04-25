
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isInitializing: boolean;
  refreshSession: () => Promise<void>;
}

// Initial context value with isInitializing=true
const AuthContext = createContext<AuthContextType>({ 
  session: null, 
  user: null, 
  isInitializing: true,
  refreshSession: async () => {} 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Function to refresh session that can be called from anywhere
  const refreshSession = async () => {
    try {
      console.log("Manual session refresh requested");
      const now = Date.now();
      
      // Prevent excessive refresh calls (minimum 3 second interval)
      if (now - lastRefresh < 3000) {
        console.log("Skipping refresh - too soon after last refresh");
        return;
      }
      
      setLastRefresh(now);
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session manually:", error);
        toast.error("Session refresh failed", { 
          description: "You may need to log in again."
        });
        return;
      }
      
      if (data && data.session) {
        console.log("Session refreshed successfully");
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (err) {
      console.error("Exception during manual session refresh:", err);
    }
  };

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

    // Auto-refresh token every 5 minutes to prevent expiration
    const refreshInterval = setInterval(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (data.session.expires_at) {
          const expiresAt = new Date(data.session.expires_at * 1000);
          const now = new Date();
          const timeLeft = (expiresAt.getTime() - now.getTime()) / 1000 / 60; // minutes
          
          if (timeLeft < 10) { // less than 10 minutes left
            console.log("Session expiring soon, refreshing...");
            await refreshSession();
          }
        }
      }
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [isInitializing]);

  return (
    <AuthContext.Provider value={{ session, user, isInitializing, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
