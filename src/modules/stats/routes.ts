import { Router } from 'express';
import { supabaseAdmin as db } from '../../config/supabase.js';
import { ISSUE_STATUSES } from '../../constants.js';
import { parse } from '../../middleware/validate.js';
import { many } from '../../utils/errors.js';
import { getChecklist } from '../checklist/service.js';
import { idParams } from '../deliveries/schemas.js';
import { getDelivery } from '../deliveries/service.js';

export const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { id } = parse(idParams, req.params);
  await getDelivery(id, req.user!);
  const sections = await getChecklist();
  const recs = many(await db.from('inspection_records').select('item_id, inspection').eq('delivery_id', id));
  const status = new Map<number, string | null>(recs.map((r: any) => [r.item_id, r.inspection]));
  let total = 0, checked = 0, issues = 0;
  const by_section = sections.map((s) => {
    let c = 0;
    for (const i of s.items) {
      const st = status.get(i.id);
      if (st) { c++; if (ISSUE_STATUSES.includes(st)) issues++; }
    }
    total += s.items.length; checked += c;
    return { section_id: s.id, total: s.items.length, checked: c };
  });
  res.json({ total, checked, issues, by_section });
});
