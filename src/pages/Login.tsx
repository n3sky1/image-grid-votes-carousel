
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const email = `${username}@internal.com`;
      console.log(`Attempting ${isSignUp ? 'signup' : 'login'} with: ${email}`);
      
      if (isSignUp) {
        // Sign up flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        });

        if (error) {
          console.error("Signup error:", error);
          toast.error("Signup failed", {
            description: error.message
          });
        } else if (data?.user) {
          console.log("Signup successful", data);
          toast.success("Signup successful. You can now log in.");
          setIsSignUp(false); // Switch back to login view
        }
      } else {
        // Login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Login error:", error);
          toast.error("Login failed", {
            description: error.message
          });
        } else if (data?.user) {
          console.log("Login successful", data);
          toast.success("Login successful");
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdfcfb] via-[#e2d1c3]/80 to-[#F1F0FB]">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {isSignUp ? "Create Account" : "Login"}
          </h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading 
                ? (isSignUp ? "Creating account..." : "Logging in...") 
                : (isSignUp ? "Create Account" : "Login")}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)} 
              className="text-sm text-blue-600 hover:underline"
            >
              {isSignUp 
                ? "Already have an account? Log in" 
                : "Don't have an account? Sign up"}
            </button>
          </div>
          
          <p className="mt-4 text-sm text-center text-gray-600">
            Please contact an administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
