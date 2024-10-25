const path = require('path');

exports.renderHomePage = async (req, res) => {
  const flagKey = 'versionone';
  const queryFlag = req.query[flagKey];
  const cookieFlag = req.cookies[flagKey];

  if (queryFlag === 'false') {
    res.clearCookie(flagKey);
    return res.sendFile(path.join(__dirname, '../public/coming_soon.html'));
  }

  if (cookieFlag === 'true' || queryFlag === '' || queryFlag === 'true') {
    res.cookie(flagKey, 'true', { maxAge: 900000, httpOnly: true });
    return res.sendFile(path.join(__dirname, '../public/index.html'));
  }

  res.sendFile(path.join(__dirname, '../public/coming_soon.html'));
};
