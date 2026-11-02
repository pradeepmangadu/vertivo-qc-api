import { Router } from 'express';
import { parse } from '../../middleware/validate.js';
import { getDelivery } from '../deliveries/service.js';
import { idParams } from '../deliveries/schemas.js';
import { itemParams, recordSchema } from './schemas.js';
import { listRecords, upsertRecord } from './service.js';

export const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  const { id } = parse(idParams, req.params);
  await getDelivery(id, req.user!);
  res.json(await listRecords(id));
});

router.put('/:itemId', async (req, res) => {
  const { id, itemId } = parse(itemParams, req.params);
  const input = parse(recordSchema, req.body);
  await getDelivery(id, req.user!);
  res.json(await upsertRecord(id, itemId, req.user!.id, input));
});
