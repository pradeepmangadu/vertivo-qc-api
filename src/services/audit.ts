import type { Request } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export async function audit(req: Request, action: string, entity: string, entityId?: string, userId?: string) {
  const { error } = await supabaseAdmin.from('audit_log').insert({
    user_id: userId ?? req.user?.id ?? null, action, entity, entity_id: entityId ?? null, ip: req.ip ?? null,
  });
  if (error) logger.error({ code: error.code }, 'audit write failed');
}
