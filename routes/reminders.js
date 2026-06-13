const express = require('express');
const router = express.Router();
const { db, admin, messaging } = require('../services/firebase');

// Invio reminder a tutti gli utenti con almeno un token FCM registrato.
// Pensato per essere richiamato da uno scheduler esterno (cron / Cloud Scheduler),
// non da un utente: l'autorizzazione è un secret condiviso (CRON_SECRET), quindi
// questa route è pubblica rispetto a verifyToken ma protetta dal secret.
router.post('/send-reminders', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  const message = req.body.message || 'Ricordati di completare le tue abitudini di oggi!';

  try {
    const snapshot = await db.collection('users').get();
    let sent = 0;

    for (const doc of snapshot.docs) {
      const tokens = doc.data().fcmTokens || [];
      if (tokens.length === 0) continue;

      const response = await messaging.sendEachForMulticast({
        notification: { title: 'Reminder', body: message },
        tokens,
      });
      sent += response.successCount;

      // Rimuove i token non più validi per non riprovarli ogni volta.
      const invalid = [];
      response.responses.forEach((r, i) => {
        if (!r.success) invalid.push(tokens[i]);
      });
      if (invalid.length > 0) {
        await doc.ref.update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalid),
        });
      }
    }

    res.json({ sent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
