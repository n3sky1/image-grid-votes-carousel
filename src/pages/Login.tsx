
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if input is already an email or just a username
      const loginEmail = email.includes('@') ? email : `${email}@internal.com`;
      console.log(`Attempting login with: ${loginEmail}`);
      
      // Try to login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
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
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email or username"
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
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-600">
            Please contact an administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
