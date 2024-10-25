const { logImageAccess } = require('../services/logger');
const path = require('path');
const fs = require('fs');

exports.getInvitation = async (req, res) => {
  let imageName = req.params.imageName;
  let clientIp =
    req.headers['x-client-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress;
  let timestamp = new Date().toISOString();
  const logEntry = `Timestamp: ${timestamp}, Image: ${imageName}, IP: ${clientIp}`;
  console.log(logEntry);
  // Check if the invitation file exists otherwise send a 404
  if (!fs.existsSync(path.join(__dirname, '../invitations', imageName))) {
    res.status(404).send('Invitation not found');
    return;
  }
  res.sendFile(path.join(__dirname, '../invitations', imageName));
  logImageAccess(imageName, clientIp).catch((error) => {
    console.error('Falied to log image access:', error);
  });
};
