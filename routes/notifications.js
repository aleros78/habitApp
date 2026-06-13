const express = require('express');
const router = express.Router();
const { db, admin } = require('../services/firebase');

// Registra (o aggiorna) il token FCM del dispositivo dell'utente autenticato.
// I token sono salvati come array su users/{uid}.fcmTokens.
router.post('/register-token', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token mancante' });
  }
  try {
    await db.collection('users').doc(req.uid).set({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
    }, { merge: true });
    res.json({ message: 'Token registrato' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
