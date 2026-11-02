import { Router } from 'express';
import { exportLimiter } from '../../middleware/rateLimit.js';
import { parse } from '../../middleware/validate.js';
import { audit } from '../../services/audit.js';
import { buildCsv } from '../../services/csvBuilder.js';
import { getChecklist } from '../checklist/service.js';
import { idParams } from '../deliveries/schemas.js';
import { getDelivery } from '../deliveries/service.js';
import { listRecords } from '../records/service.js';

export const router = Router({ mergeParams: true });

router.get('/export.csv', exportLimiter, async (req, res) => {
  const { id } = parse(idParams, req.params);
  const delivery = await getDelivery(id, req.user!);
  const csv = buildCsv(delivery, await getChecklist(), await listRecords(id));
  await audit(req, 'export_csv', 'delivery', id);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="Vertivo_Delivery_QC.csv"' }).send(csv);
});

// Backup contains data only — photos are not embedded (they stay in private storage).
router.get('/backup.json', exportLimiter, async (req, res) => {
  const { id } = parse(idParams, req.params);
  const delivery = await getDelivery(id, req.user!);
  const records = (await listRecords(id)).map(({ photo_url, ...r }) => ({ ...r, has_photo: Boolean(photo_url) }));
  await audit(req, 'export_backup', 'delivery', id);
  res.set({ 'Content-Disposition': 'attachment; filename="Vertivo_QC_backup.json"' })
    .json({ exported_at: new Date().toISOString(), delivery, records });
});
