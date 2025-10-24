"use client";

import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

/**
 * Custom hook to manage authentication state
 * Automatically tracks the current user and loading state
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { user, loading, authenticated } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!authenticated) return <Navigate to="/login" />;
 *
 *   return <div>Welcome {user?.email}</div>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    authenticated: !!user,
  };
}
