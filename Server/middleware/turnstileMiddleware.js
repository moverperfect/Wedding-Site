import fs from 'fs';
import path from 'path';

export const replaceTurnstileSiteKey = (req, res, next) => {
  if (req.path === '/') {
    const indexPath = path.join(process.cwd(), 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace('{{TURNSTILE_SITE_KEY}}', process.env.CLOUDFLARE_TURNSTILE_SITE_KEY);
    res.send(html);
  } else {
    next();
  }
}; 
