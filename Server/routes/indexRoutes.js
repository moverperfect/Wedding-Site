import express from 'express';
import { renderHomePage } from '../controllers/indexController.js';

const router = express.Router();

router.get(['/', 'index.html'], renderHomePage);

export default router;
