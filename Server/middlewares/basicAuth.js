import { PASSWORD } from '../config/keys.js';

export default function (req, res, next) {
  const auth = { login: 'admin', password: PASSWORD };

  // Parse login and password from the Authorization header
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64')
    .toString()
    .split(':');

  // Verify login and password
  if (login && password && login === auth.login && password === auth.password) {
    // Access granted
    return next();
  }

  // Access denied
  res.set('WWW-Authenticate', 'Basic realm="401"'); // Change realm as needed
  res.status(401).send('Authentication required.');
}
