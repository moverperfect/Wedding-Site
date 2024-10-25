import express from 'express';
import { getInvitation } from '../controllers/invitationController.js';

const router = express.Router();

router.get('/:imageName', async (req, res, next) => {
  getInvitation(req, res).catch(next);
});

export default router;
