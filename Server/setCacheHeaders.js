/**
 * Set cache headers for an Express request.
 */
const setCacheHeaders = (req, res, next) => {
  const doNotCache = () => {
    res.setHeader('Cache-Control', 'no-cache');
    next();
  };

  const cacheForOneDay = () => {
    // 86400 seconds = 1 day
    res.setHeader('Cache-Control', 'public, max-age=86400');
    next();
  };

  const CACHEABLE_EXTENSIONS = [
    'css',
    'js',
    'svg',
    'css.map',
    'js.map',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'ico',
    'xml',
    'json',
    'txt',
    'woff2',
    'woff',
  ];

  if (req.method !== 'GET') {
    return doNotCache();
  }

  switch (true) {
    case CACHEABLE_EXTENSIONS.some((ext) => req.url.endsWith(`.${ext}`)):
      return cacheForOneDay();

    default:
      return doNotCache();
  }
};

module.exports = {
  setCacheHeaders,
};
