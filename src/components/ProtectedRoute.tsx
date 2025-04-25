
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, isInitializing } = useAuth();

  // Don't redirect while auth is initializing
  if (isInitializing) {
    console.log("Auth is initializing, showing loading state...");
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Checking authentication...</div>
      </div>
    );
  }

  if (!session) {
    console.log("No session found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("Session found, rendering protected content");
  return <>{children}</>;
};

export default ProtectedRoute;
