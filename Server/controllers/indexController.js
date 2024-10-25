import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  flags: {
    VERSION_ONE: 'versionone',
  },
};

const COOKIE_OPTIONS = {
  maxAge: 900000,
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
};

export const renderHomePage = (req, res) => {
  const flagKey = CONFIG.flags.VERSION_ONE;
  const queryFlag =
    typeof req.query[flagKey] === 'string'
      ? req.query[flagKey]
      : String(req.query[flagKey]) || '';
  const cookieFlag = req.cookies[flagKey];

  if (queryFlag === 'false') {
    res.clearCookie(flagKey);
    return res.sendFile(path.join(__dirname, '../public/coming_soon.html'));
  }

  if (cookieFlag === 'true' || ['', 'true'].includes(queryFlag)) {
    res.cookie(flagKey, 'true', COOKIE_OPTIONS);
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }

  res.sendFile(path.join(__dirname, '../public/coming_soon.html'));
};
