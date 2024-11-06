import path from 'path';
import { CONFIG } from '../config/config.js';

const COOKIE_OPTIONS = {
  maxAge: 900000,
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
};

export const renderHomePage = (req, res) => {
  const flagKey = CONFIG.flags.VERSION_ONE.key;
  const flagToggle = CONFIG.flags.VERSION_ONE.value;
  const queryFlag =
    typeof req.query[flagKey] === 'string'
      ? req.query[flagKey]
      : String(req.query[flagKey]) || '';
  const cookieFlag = req.cookies[flagKey];

  if (flagToggle === 'true') {
    return res.sendFile(path.join(CONFIG.dirname, 'public/index.html'));
  }

  if (queryFlag === 'false') {
    res.clearCookie(flagKey);
    return res.sendFile(path.join(CONFIG.dirname, 'public/coming_soon.html'));
  }

  if (cookieFlag === 'true' || ['', 'true'].includes(queryFlag)) {
    res.cookie(flagKey, 'true', COOKIE_OPTIONS);
    return res.sendFile(path.join(CONFIG.dirname, 'public/index.html'));
  }

  res.sendFile(path.join(CONFIG.dirname, 'public/coming_soon.html'));
};
