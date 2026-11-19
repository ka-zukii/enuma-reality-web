import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        // Jangan timpa state session bila event hanya token refreshed biasa tanpa perubahan user ID
        if (event === "SIGNED_OUT") {
          setSession(null);
        } else if (newSession) {
          setSession((prev) => {
            if (prev?.user?.id === newSession.user?.id && prev?.access_token === newSession.access_token) {
              return prev;
            }
            return newSession;
          });
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = () => supabase.auth.signOut();

  return { session, loading, signOut };
}
