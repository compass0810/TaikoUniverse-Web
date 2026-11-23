"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export async function loginWithDiscord(): Promise<void> {
  await getSupabase().auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
}

export async function logout(): Promise<void> {
  await getSupabase().auth.signOut({ scope: "local" });
}
