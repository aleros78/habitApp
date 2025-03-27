const express = require('express');
const router = express.Router();
const { admin } = require('../services/firebase');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    res.json({ uid: userRecord.uid, email: userRecord.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  res.status(400).json({ error: "Il login con email e password deve essere gestito dal frontend!" });
});

module.exports = router;
