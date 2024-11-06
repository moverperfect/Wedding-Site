import { logImageAccess } from '../services/logger.js';
import path from 'path';
import fs from 'fs';
import getClientIp from '../utils/network.js';
import { CONFIG } from '../config/config.js';

export const getInvitation = async (req, res) => {
  const imageName = path.basename(req.params.imageName);
  const invitationsDir = path.join(CONFIG.dirname, 'invitations');
  const userFilename = path.join(invitationsDir, imageName);
  const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
  if (!ALLOWED_EXTENSIONS.includes(path.extname(imageName))) {
    res.status(400).send('Invalid file type');
    return;
  }
  if (imageName.length > 100 || !/^[a-zA-Z0-9-_\.]+$/.test(imageName)) {
    res.status(400).send('Invalid filename');
    return;
  }

  let clientIp = getClientIp(req);
  let timestamp = new Date().toISOString();
  const logEntry = `Timestamp: ${timestamp}, Image: ${imageName}, IP: ${clientIp}`;
  console.log(logEntry);
  if (!userFilename.startsWith(invitationsDir)) {
    res.status(403).send('Access denied');
    return;
  }
  if (!fs.existsSync(userFilename)) {
    res.status(404).send('Invitation not found');
    return;
  }
  res.sendFile(userFilename);
  logImageAccess(imageName, clientIp).catch((error) => {
    console.error('Failed to log image access:', error);
  });
};
