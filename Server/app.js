import express from 'express';
import cookieParser from 'cookie-parser';
import setCacheHeaders from './middlewares/setCacheHeaders.js';
import { replaceTurnstileSiteKey } from './middleware/turnstileMiddleware.js';
import 'dotenv/config.js'

const requiredEnvVars = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'PASSWORD', 'CLOUDFLARE_TURNSTILE_SITE_KEY', 'CLOUDFLARE_TURNSTILE_SECRET_KEY'];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing environment variable: ${envVar}`);
  }
});

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(cookieParser());
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
app.use(setCacheHeaders);
app.use(replaceTurnstileSiteKey);

export default app;
