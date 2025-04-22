
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use magic link authentication instead of password
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error("Login error:", error);
        toast.error("Login failed", {
          description: error.message
        });
      } else {
        console.log("Magic link sent successfully");
        toast.success("Magic link sent", {
          description: "Check your email for the login link"
        });
        setMagicLinkSent(true);
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
          
          {magicLinkSent ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-medium">Magic link sent!</div>
              <p className="text-gray-600">
                Check your email for a login link. Click the link to sign in.
              </p>
              <Button 
                className="mt-4"
                variant="outline"
                onClick={() => setMagicLinkSent(false)}
              >
                Send another link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending magic link..." : "Send magic link"}
              </Button>
            </form>
          )}
          
          <p className="mt-4 text-sm text-center text-gray-600">
            We'll send you a magic link for passwordless login.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
