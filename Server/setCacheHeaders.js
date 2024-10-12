const { RequestHandler } = require('express');

/**
 * Set cache headers for an Express request.
 */
const setCacheHeaders = async (req, res, next) => {
  const doNotCache = () => {
    res.setHeader('Cache-Control', 'no-cache');
    next();
  };

  const cacheForOneDay = () => {
    // 86400 seconds = 1 day
    res.setHeader('Cache-Control', 'public, max-age=86400');
    next();
  };

  if (req.method !== 'GET') {
    return doNotCache();
  }

  switch (true) {
    case !!req.url.match(
      /^\/.*\.(css|js|svg|css\.map|js\.map|png|jpg|jpeg|gif|webp|ico|xml|json|txt|woff2|woff)$/g
    ):
      return cacheForOneDay();
    
    default:
      return doNotCache();
  }
};

module.exports = {
  setCacheHeaders,
};
