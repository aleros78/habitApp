const express = require('express');
const router = express.Router();
const { messaging } = require('../services/firebase');

router.post('/notifications', async (req, res) => {
  const { token, message } = req.body;

  const notification = {
    notification: {
      title: 'Reminder',
      body: message
    },
    token
  };

  try {
    await messaging.send(notification);
    res.json({ message: 'Notifica inviata con successo' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
