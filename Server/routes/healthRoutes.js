import express from 'express';
import { checkHealth } from '../controllers/healthController.js';
import basicAuth from '../middlewares/basicAuth.js';

const router = express.Router();

router.get('', basicAuth, checkHealth);

export default router;
