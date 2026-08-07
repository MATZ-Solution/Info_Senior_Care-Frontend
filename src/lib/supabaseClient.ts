import { createClient } from "@supabase/supabase-js";

// Used ONLY for the OAuth redirect handshake (Google/Apple sign-in) --
// everything else in the app talks to the FastAPI backend via lib/api.ts.
// Supabase's JS SDK is the only thing that knows how to drive the OAuth
// redirect + PKCE code exchange, so this client exists purely to get us a
// Supabase access_token, which is then handed off to the same
// Authorization: Bearer flow every other request already uses.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set -- Google/Apple sign-in will not work."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    flowType: "pkce",
    // The /auth/callback page exchanges the code itself (see
    // completeOAuthSignIn) so the result is awaited rather than racing an
    // implicit background exchange the page can't observe.
    detectSessionInUrl: false,
  },
});
