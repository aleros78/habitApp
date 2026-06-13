const { admin } = require('../services/firebase');

/**
 * Middleware di autenticazione.
 * Verifica il Firebase ID token passato come header `Authorization: Bearer <token>`
 * e popola `req.uid` con l'UID dell'utente autenticato.
 * Risponde 401 se il token manca o non è valido.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer (.+)$/);

  if (!match) {
    return res.status(401).json({ error: 'Token di autenticazione mancante' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.uid = decoded.uid;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token di autenticazione non valido' });
  }
}

module.exports = verifyToken;
