import { Router } from 'express';
import { getChecklist } from './service.js';
export const router = Router();
router.get('/', async (_req, res) => { res.json(await getChecklist()); });
