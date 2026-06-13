const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const stripe = require('../services/stripe');

// Crea una sessione di Stripe Checkout per l'acquisto una-tantum del Premium.
// L'utente autenticato è identificato da req.uid; il webhook lo userà per
// impostare isPremium server-side a pagamento avvenuto.
router.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      client_reference_id: req.uid,
      metadata: { uid: req.uid },
      success_url: `${process.env.FRONTEND_URL}/?premium=success`,
      cancel_url: `${process.env.FRONTEND_URL}/?premium=cancel`,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stato Premium dell'utente autenticato.
router.get('/premium-status', async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.uid).get();
    const isPremium = userDoc.exists ? !!userDoc.data().isPremium : false;
    res.json({ isPremium });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
