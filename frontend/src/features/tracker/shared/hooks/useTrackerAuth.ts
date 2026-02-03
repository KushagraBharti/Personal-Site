import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import supabase, { isSupabaseConfigured } from "../supabase/client";

export const useTrackerAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    const client = supabase;

    const init = async () => {
      try {
        const { data } = await client.auth.getSession();
        setSession(data.session);
        setAuthLoading(false);
      } catch (error) {
        console.error("Failed to get Supabase session", error);
        setSession(null);
        setAuthLoading(false);
      }
    };

    init();

    const { data: listener } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      setAuthError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  return {
    session,
    authLoading,
    authError,
    signIn,
    signOut,
    isSupabaseConfigured,
    supabase,
  };
};
