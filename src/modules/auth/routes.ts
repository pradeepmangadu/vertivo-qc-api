import { Router } from 'express';
import { z } from 'zod';
import { COOKIES } from '../../constants.js';
import { supabaseAdmin, supabaseAnon } from '../../config/supabase.js';
import { authenticate } from '../../middleware/authenticate.js';
import { clearSessionCookies, setSessionCookies } from '../../middleware/cookies.js';
import { issueCsrf } from '../../middleware/csrf.js';
import { loginLimiter, refreshLimiter } from '../../middleware/rateLimit.js';
import { parse } from '../../middleware/validate.js';
import { audit } from '../../services/audit.js';
import { HttpError } from '../../utils/errors.js';

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(200) }).strict();
export const router = Router();

router.get('/csrf', issueCsrf);

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new HttpError(401, 'Invalid email or password'); // same message for every failure
  const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, role').eq('id', data.user.id).maybeSingle();
  if (!profile) throw new HttpError(403, 'Account is not set up');
  setSessionCookies(res, data.session);
  await audit(req, 'login', 'session', data.user.id, data.user.id);
  res.json({ id: data.user.id, email: data.user.email ?? '', name: profile.full_name, role: profile.role });
});

router.post('/refresh', refreshLimiter, async (req, res) => {
  const rt = req.cookies?.[COOKIES.refresh];
  if (typeof rt !== 'string' || !rt) throw new HttpError(401, 'Unauthorized');
  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: rt });
  if (error || !data.session) { clearSessionCookies(res); throw new HttpError(401, 'Unauthorized'); }
  setSessionCookies(res, data.session);
  res.json({ ok: true });
});

router.post('/logout', async (req, res) => {
  const at = req.cookies?.[COOKIES.access];
  if (typeof at === 'string' && at) await supabaseAdmin.auth.admin.signOut(at).catch(() => undefined);
  clearSessionCookies(res);
  res.status(204).end();
});

router.get('/me', authenticate, (req, res) => { res.json(req.user); });
