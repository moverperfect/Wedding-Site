import express from 'express';
import { handleFormSubmission } from '../controllers/submitController.js';

const router = express.Router();

router.use(express.urlencoded({ extended: false }));

router.post('', handleFormSubmission);

export default router;
