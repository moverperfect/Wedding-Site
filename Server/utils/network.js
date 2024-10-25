const getClientIp = (req) => {
  return (
    req.headers['x-client-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress
  );
};

export default getClientIp;
