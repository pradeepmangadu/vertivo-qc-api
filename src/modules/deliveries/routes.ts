import { Router } from 'express';
import { authorize } from '../../middleware/authorize.js';
import { parse } from '../../middleware/validate.js';
import { audit } from '../../services/audit.js';
import { router as recordsRouter } from '../records/routes.js';
import { router as photosRouter } from '../photos/routes.js';
import { router as statsRouter } from '../stats/routes.js';
import { router as exportsRouter } from '../exports/routes.js';
import { createDeliverySchema, idParams, updateDeliverySchema } from './schemas.js';
import { createDelivery, getDelivery, listDeliveries, softDeleteDelivery, updateDelivery } from './service.js';

export const router = Router();

router.get('/', async (req, res) => { res.json(await listDeliveries(req.user!)); });

router.post('/', async (req, res) => {
  const input = parse(createDeliverySchema, req.body ?? {});
  const row = await createDelivery(req.user!, input);
  await audit(req, 'create', 'delivery', row.id);
  res.status(201).json(row);
});

router.get('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json(await getDelivery(id, req.user!));
});

router.patch('/:id', async (req, res) => {
  const { id } = parse(idParams, req.params);
  const input = parse(updateDeliverySchema, req.body);
  res.json(await updateDelivery(id, req.user!, input));
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  const { id } = parse(idParams, req.params);
  await softDeleteDelivery(id, req.user!);
  await audit(req, 'delete', 'delivery', id);
  res.status(204).end();
});

router.use('/:id/records/:itemId/photo', photosRouter);
router.use('/:id/records', recordsRouter);
router.use('/:id/stats', statsRouter);
router.use('/:id', exportsRouter);
