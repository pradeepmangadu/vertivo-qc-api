import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

/** Service-role client: bypasses RLS. Server-side only. Authorization is enforced in our code. */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, opts);
/** Anon client: used only for password sign-in and token refresh. */
export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, opts);
