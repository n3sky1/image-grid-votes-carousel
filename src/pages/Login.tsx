
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailNotConfirmed(false);
    
    try {
      // Try to sign in with email password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        // Remove the options object with gotrue
      });

      if (error) {
        console.error("Login error:", error);

        // Check if the error is due to email not being confirmed
        if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
          setEmailNotConfirmed(true);
        } else {
          // Generic error message for other failed logins
          toast.error("Login failed", {
            description: "Please check your credentials and try again."
          });
        }
      } else if (data?.user) {
        console.log("Login successful", data);
        toast.success("Login successful");
        navigate("/");
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
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">System Login</h2>
          
          {emailNotConfirmed && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800">
                Your email address has not been confirmed. Please check your inbox for a confirmation email or contact the administrator.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter your email address" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter your password" 
                required 
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-600">This login is restricted to authorized users only.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
